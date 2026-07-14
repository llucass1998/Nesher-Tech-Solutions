import crypto from 'crypto';
import { Request, Response } from 'express';
import { Prisma } from '../generated/prisma';
import { prisma } from '../lib/prisma';
import { sendError } from '../lib/api-error';

const deliveryStatuses = ['PENDING', 'ASSIGNED', 'ACCEPTED', 'IN_TRANSIT', 'ARRIVED', 'DELIVERED', 'FAILED', 'CANCELED'];
const occurrenceSeverities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const occurrenceStatuses = ['OPEN', 'IN_REVIEW', 'RESOLVED', 'CANCELED'];
const reprocessableIntegrationStatuses = ['FAILED', 'DEAD_LETTER'];

function getParamValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function getQueryValue(value: unknown) {
  return Array.isArray(value) ? value[0] : value;
}

function parsePositiveInt(value: unknown, fallback: number, max: number) {
  const parsed = Number(getQueryValue(value));
  if (!Number.isInteger(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, max);
}

function asOptionalString(value: unknown) {
  const normalized = getQueryValue(value);
  return typeof normalized === 'string' && normalized.trim() ? normalized.trim() : undefined;
}

function getPayloadString(payload: Prisma.JsonValue, key: string) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return undefined;
  }

  const value = (payload as Record<string, unknown>)[key];
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function buildDeliveryWhere(query: Request['query']): Prisma.DeliveryWhereInput {
  const status = asOptionalString(query.status);
  const driverId = asOptionalString(query.driverId);
  const vehicleId = asOptionalString(query.vehicleId);
  const search = asOptionalString(query.search);

  return {
    ...(status && { status }),
    ...(driverId && { driverId }),
    ...(vehicleId && { vehicleId }),
    ...(search && {
      OR: [
        { description: { contains: search, mode: 'insensitive' } },
        { pickupAddress: { contains: search, mode: 'insensitive' } },
        { deliveryAddress: { contains: search, mode: 'insensitive' } },
      ],
    }),
  };
}

function getRequestId(req: Request) {
  const value = req.headers['x-request-id'];
  return Array.isArray(value) ? value[0] : value;
}

function getCorrelationId(req: Request) {
  const value = req.headers['x-correlation-id'];
  return Array.isArray(value) ? value[0] : value;
}

export class LogiflowOperationsController {
  async receiveLogideskTicketUpdate(req: Request, res: Response) {
    const serviceToken = req.headers['x-service-token'];
    const expectedToken = process.env.LOGIDESK_SERVICE_TOKEN;

    if (!expectedToken || serviceToken !== expectedToken) {
      return sendError(res, 401, 'AUTHENTICATION_REQUIRED', 'Token de servico invalido.');
    }

    const { occurrenceId, ticketNumber, status, eventType, message } = req.body as {
      occurrenceId?: string;
      ticketNumber?: string;
      status?: string;
      eventType?: string;
      message?: string;
    };

    if (!occurrenceId || !ticketNumber) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'occurrenceId e ticketNumber sao obrigatorios.');
    }

    try {
      const updated = await prisma.occurrence.update({
        where: { id: occurrenceId },
        data: {
          ticketNumber,
          integrationStatus: 'COMPLETED',
          lastError: null,
          ...(status === 'RESOLVED' || status === 'CLOSED' ? { status: 'RESOLVED' } : {}),
        },
      });

      return res.json({
        occurrence: updated,
        received: { eventType, status, message },
      });
    } catch (error) {
      console.error(error);
      return sendError(res, 404, 'RESOURCE_NOT_FOUND', 'Ocorrencia vinculada ao ticket nao encontrada.');
    }
  }

  async listDeliveries(req: Request, res: Response) {
    const page = parsePositiveInt(req.query.page, 1, 10_000);
    const pageSize = parsePositiveInt(req.query.pageSize, 20, 100);
    const where = buildDeliveryWhere(req.query);

    try {
      const [total, data] = await Promise.all([
        prisma.delivery.count({ where }),
        prisma.delivery.findMany({
          where,
          include: {
            driver: { select: { id: true, name: true, email: true, phone: true, status: true } },
            vehicle: { select: { id: true, model: true, plate: true, status: true } },
            occurrences: {
              orderBy: { createdAt: 'desc' },
              take: 3,
            },
            proofs: {
              orderBy: { createdAt: 'desc' },
              take: 3,
            },
          },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
      ]);

      return res.json({
        data,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.max(1, Math.ceil(total / pageSize)),
        },
      });
    } catch (error) {
      console.error(error);
      return sendError(res, 500, 'INTERNAL_ERROR', 'Erro ao listar entregas.');
    }
  }

  async deliveryTimeline(req: Request, res: Response) {
    const deliveryId = getParamValue(req.params.id);

    if (!deliveryId) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'ID da entrega e obrigatorio.');
    }

    try {
      const delivery = await prisma.delivery.findUnique({
        where: { id: deliveryId },
        include: {
          driver: { select: { id: true, name: true, email: true, phone: true, status: true } },
          vehicle: { select: { id: true, model: true, plate: true, status: true } },
          statusHistory: { orderBy: { createdAt: 'asc' } },
          occurrences: { orderBy: { createdAt: 'asc' } },
          proofs: { orderBy: { createdAt: 'asc' } },
        },
      });

      if (!delivery) {
        return sendError(res, 404, 'RESOURCE_NOT_FOUND', 'Entrega nao encontrada.');
      }

      return res.json({
        delivery,
        timeline: [
          ...delivery.statusHistory.map((item) => ({
            type: 'STATUS',
            createdAt: item.createdAt,
            data: item,
          })),
          ...delivery.occurrences.map((item) => ({
            type: 'OCCURRENCE',
            createdAt: item.createdAt,
            data: item,
          })),
          ...delivery.proofs.map((item) => ({
            type: 'PROOF',
            createdAt: item.createdAt,
            data: item,
          })),
        ].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()),
      });
    } catch (error) {
      console.error(error);
      return sendError(res, 500, 'INTERNAL_ERROR', 'Erro ao carregar timeline da entrega.');
    }
  }

  async updateDeliveryStatus(req: Request, res: Response) {
    const deliveryId = getParamValue(req.params.id);
    const { status, reason } = req.body as { status?: string; reason?: string };

    if (!deliveryId) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'ID da entrega e obrigatorio.');
    }

    if (!status || !deliveryStatuses.includes(status)) {
      return sendError(res, 422, 'INVALID_STATUS_TRANSITION', 'Status invalido.');
    }

    try {
      const currentDelivery = await prisma.delivery.findUnique({ where: { id: deliveryId } });

      if (!currentDelivery) {
        return sendError(res, 404, 'RESOURCE_NOT_FOUND', 'Entrega nao encontrada.');
      }

      const result = await prisma.$transaction(async (tx) => {
        const delivery = await tx.delivery.update({
          where: { id: deliveryId },
          data: { status },
          include: {
            driver: { select: { id: true, name: true, email: true, phone: true, status: true } },
            vehicle: { select: { id: true, model: true, plate: true, status: true } },
          },
        });

        const history = await tx.deliveryStatusHistory.create({
          data: {
            deliveryId,
            previousStatus: currentDelivery.status,
            newStatus: status,
            changedByUserId: req.auth?.id,
            reason,
            requestId: getRequestId(req),
            correlationId: getCorrelationId(req),
          },
        });

        return { delivery, history };
      });

      return res.json(result);
    } catch (error) {
      console.error(error);
      return sendError(res, 500, 'INTERNAL_ERROR', 'Erro ao atualizar status da entrega.');
    }
  }

  async createOccurrence(req: Request, res: Response) {
    const deliveryId = getParamValue(req.params.id);
    const { title, description, severity = 'MEDIUM' } = req.body as {
      title?: string;
      description?: string;
      severity?: string;
    };

    if (!deliveryId) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'ID da entrega e obrigatorio.');
    }

    if (!title || !description) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Titulo e descricao sao obrigatorios.');
    }

    if (!occurrenceSeverities.includes(severity)) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Severidade invalida.');
    }

    try {
      const delivery = await prisma.delivery.findUnique({ where: { id: deliveryId } });

      if (!delivery) {
        return sendError(res, 404, 'RESOURCE_NOT_FOUND', 'Entrega nao encontrada.');
      }

      const occurrence = await prisma.occurrence.create({
        data: {
          deliveryId,
          title,
          description,
          severity,
          status: 'OPEN',
          integrationStatus: 'NOT_REQUESTED',
          createdByUserId: req.auth?.id,
        },
      });

      return res.status(201).json(occurrence);
    } catch (error) {
      console.error(error);
      return sendError(res, 500, 'INTERNAL_ERROR', 'Erro ao criar ocorrencia.');
    }
  }

  async updateOccurrence(req: Request, res: Response) {
    const occurrenceId = getParamValue(req.params.id);
    const { status, severity, integrationStatus, lastError, ticketNumber } = req.body as {
      status?: string;
      severity?: string;
      integrationStatus?: string;
      lastError?: string | null;
      ticketNumber?: string | null;
    };

    if (!occurrenceId) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'ID da ocorrencia e obrigatorio.');
    }

    if (status && !occurrenceStatuses.includes(status)) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Status de ocorrencia invalido.');
    }

    if (severity && !occurrenceSeverities.includes(severity)) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Severidade invalida.');
    }

    try {
      const occurrence = await prisma.occurrence.update({
        where: { id: occurrenceId },
        data: {
          ...(status != null && { status }),
          ...(severity != null && { severity }),
          ...(integrationStatus != null && { integrationStatus }),
          ...(lastError !== undefined && { lastError }),
          ...(ticketNumber !== undefined && { ticketNumber }),
        },
      });

      return res.json(occurrence);
    } catch (error: unknown) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        return sendError(res, 404, 'RESOURCE_NOT_FOUND', 'Ocorrencia nao encontrada.');
      }

      console.error(error);
      return sendError(res, 500, 'INTERNAL_ERROR', 'Erro ao atualizar ocorrencia.');
    }
  }

  async reprocessOccurrence(req: Request, res: Response) {
    const occurrenceId = getParamValue(req.params.id);

    if (!occurrenceId) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'ID da ocorrencia e obrigatorio.');
    }

    try {
      const occurrence = await prisma.occurrence.findUnique({ where: { id: occurrenceId } });

      if (!occurrence) {
        return sendError(res, 404, 'RESOURCE_NOT_FOUND', 'Ocorrencia nao encontrada.');
      }

      if (!reprocessableIntegrationStatuses.includes(occurrence.integrationStatus)) {
        return sendError(res, 409, 'INTEGRATION_UNAVAILABLE', 'Ocorrencia nao esta em estado reprocessavel.');
      }

      const updated = await prisma.occurrence.update({
        where: { id: occurrenceId },
        data: {
          integrationStatus: 'PENDING',
          retryCount: { increment: 1 },
          lastError: null,
        },
      });

      return res.json(updated);
    } catch (error) {
      console.error(error);
      return sendError(res, 500, 'INTERNAL_ERROR', 'Erro ao reprocessar ocorrencia.');
    }
  }

  async listDeadLetterEvents(req: Request, res: Response) {
    const correlationId = asOptionalString(req.query.correlationId);

    try {
      const events = await prisma.deadLetterEvent.findMany({
        where: {
          ...(correlationId ? { correlationId } : {}),
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      });

      return res.json({ data: events });
    } catch (error) {
      console.error(error);
      return sendError(res, 500, 'INTERNAL_ERROR', 'Erro ao listar eventos em DLQ.');
    }
  }

  async reprocessDeadLetterEvent(req: Request, res: Response) {
    const deadLetterId = getParamValue(req.params.id);

    if (!deadLetterId) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'ID do evento em DLQ e obrigatorio.');
    }

    try {
      const deadLetter = await prisma.deadLetterEvent.findUnique({ where: { id: deadLetterId } });

      if (!deadLetter) {
        return sendError(res, 404, 'RESOURCE_NOT_FOUND', 'Evento em DLQ nao encontrado.');
      }

      if (!deadLetter.outboxEventId) {
        return sendError(res, 422, 'INTEGRATION_INVALID_RESPONSE', 'Evento em DLQ nao possui outbox vinculado.');
      }

      const outboxEvent = await prisma.outboxEvent.findUnique({ where: { id: deadLetter.outboxEventId } });

      if (!outboxEvent) {
        return sendError(res, 404, 'RESOURCE_NOT_FOUND', 'Outbox vinculado nao encontrado.');
      }

      if (outboxEvent.status !== 'DEAD_LETTER') {
        return sendError(res, 409, 'INTEGRATION_UNAVAILABLE', 'Outbox vinculado nao esta em DEAD_LETTER.');
      }

      const occurrenceId = getPayloadString(outboxEvent.payload, 'occurrenceId');

      const result = await prisma.$transaction(async (tx) => {
        const updatedOutbox = await tx.outboxEvent.update({
          where: { id: outboxEvent.id },
          data: {
            status: 'PENDING',
            attempts: 0,
            lastError: null,
            processedAt: null,
          },
        });

        const updatedOccurrence = occurrenceId
          ? await tx.occurrence.update({
              where: { id: occurrenceId },
              data: {
                integrationStatus: 'PENDING',
                lastError: null,
              },
            })
          : null;

        return {
          outboxEvent: updatedOutbox,
          occurrence: updatedOccurrence,
        };
      });

      return res.json(result);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        return sendError(res, 404, 'RESOURCE_NOT_FOUND', 'Recurso vinculado ao evento em DLQ nao encontrado.');
      }

      console.error(error);
      return sendError(res, 500, 'INTERNAL_ERROR', 'Erro ao reprocessar evento em DLQ.');
    }
  }

  async escalateOccurrence(req: Request, res: Response) {
    const occurrenceId = getParamValue(req.params.id);

    if (!occurrenceId) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'ID da ocorrencia e obrigatorio.');
    }

    try {
      const occurrence = await prisma.occurrence.findUnique({
        where: { id: occurrenceId },
        include: {
          delivery: {
            include: {
              driver: { select: { id: true, name: true, email: true } },
              vehicle: { select: { id: true, plate: true, model: true } },
            },
          },
        },
      });

      if (!occurrence) {
        return sendError(res, 404, 'RESOURCE_NOT_FOUND', 'Ocorrencia nao encontrada.');
      }

      if (occurrence.integrationStatus === 'PROCESSING' || occurrence.integrationStatus === 'COMPLETED') {
        return sendError(res, 409, 'IDEMPOTENCY_CONFLICT', 'Ocorrencia ja foi escalada para suporte.');
      }

      const correlationId = getCorrelationId(req) ?? crypto.randomUUID();
      const idempotencyKey = `logiflow:occurrence:${occurrence.id}:ticket`;

      const result = await prisma.$transaction(async (tx) => {
        const updated = await tx.occurrence.update({
          where: { id: occurrence.id },
          data: {
            integrationStatus: 'PENDING',
            retryCount: { increment: 1 },
            lastError: null,
          },
        });

        const outbox = await tx.outboxEvent.upsert({
          where: { idempotencyKey },
          update: {
            status: 'PENDING',
            attempts: { increment: 1 },
            lastError: null,
            correlationId,
          },
          create: {
            eventType: 'logiflow.occurrence.escalated',
            eventVersion: 1,
            idempotencyKey,
            correlationId,
            causationId: occurrence.id,
            payload: {
              deliveryId: occurrence.deliveryId,
              occurrenceId: occurrence.id,
              subject: occurrence.title,
              description: occurrence.description,
              severity: occurrence.severity,
              priority: mapSeverityToPriority(occurrence.severity),
              requesterUserId: req.auth?.id,
              requesterRole: req.auth?.role,
              requesterEmail: req.auth?.email,
              driver: occurrence.delivery.driver,
              vehicle: occurrence.delivery.vehicle,
              delivery: {
                description: occurrence.delivery.description,
                pickupAddress: occurrence.delivery.pickupAddress,
                deliveryAddress: occurrence.delivery.deliveryAddress,
              },
            },
          },
        });

        return { occurrence: updated, outbox };
      });

      return res.status(202).json(result);
    } catch (error) {
      console.error(error);
      return sendError(res, 500, 'INTERNAL_ERROR', 'Erro ao escalar ocorrencia para o LogiDesk.');
    }
  }

  async createProof(req: Request, res: Response) {
    const deliveryId = getParamValue(req.params.id);
    const { url, type = 'PHOTO', description } = req.body as {
      url?: string;
      type?: string;
      description?: string;
    };

    if (!deliveryId) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'ID da entrega e obrigatorio.');
    }

    if (!url) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'URL do comprovante e obrigatoria.');
    }

    try {
      const delivery = await prisma.delivery.findUnique({ where: { id: deliveryId } });

      if (!delivery) {
        return sendError(res, 404, 'RESOURCE_NOT_FOUND', 'Entrega nao encontrada.');
      }

      const proof = await prisma.deliveryProof.create({
        data: {
          deliveryId,
          url,
          type,
          description,
          uploadedByUserId: req.auth?.id,
        },
      });

      return res.status(201).json(proof);
    } catch (error) {
      console.error(error);
      return sendError(res, 500, 'INTERNAL_ERROR', 'Erro ao registrar comprovante.');
    }
  }
}

function mapSeverityToPriority(severity: string) {
  if (severity === 'CRITICAL') return 'URGENT';
  if (severity === 'HIGH') return 'HIGH';
  if (severity === 'LOW') return 'LOW';
  return 'MEDIUM';
}
