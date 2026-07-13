import { z } from 'zod';

export const platformEventEnvelopeSchema = z.object({
  eventId: z.string().uuid(),
  eventType: z.string().min(1),
  eventVersion: z.number().int().positive(),
  occurredAt: z.string().datetime(),
  correlationId: z.string().uuid(),
  data: z.record(z.string(), z.unknown()),
});

export const employeeOperationalStatusEventSchema = platformEventEnvelopeSchema.extend({
  eventType: z.enum([
    'people.employee_hired',
    'people.employee_updated',
    'people.employee_transferred',
    'people.employee_unavailable',
    'people.employee_available',
    'people.employee_operational_eligibility_changed',
    'people.employee_terminated',
  ]),
  data: z.object({
    employeeId: z.string().uuid(),
    name: z.string().optional(),
    corporateEmail: z.string().email().optional(),
    corporatePhone: z.string().optional(),
    position: z.string().optional(),
    operationalStatus: z.string().optional(),
    availability: z.string().optional(),
    requiredTrainingStatus: z.string().optional(),
    licenseExpiration: z.string().date().optional(),
  }),
});

export const logiflowOccurrenceEscalatedEventSchema = platformEventEnvelopeSchema.extend({
  eventType: z.literal('logiflow.occurrence_escalated'),
  eventVersion: z.literal(1),
  data: z.object({
    deliveryId: z.string().uuid(),
    occurrenceId: z.string().uuid(),
    subject: z.string().min(3),
    description: z.string().min(3),
    severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  }),
});

export const logideskTicketCreatedEventSchema = platformEventEnvelopeSchema.extend({
  eventType: z.literal('ticket.created'),
  eventVersion: z.literal(1),
  data: z.object({
    ticketId: z.string().uuid(),
    ticketNumber: z.string().min(1),
    deliveryId: z.string().uuid().optional(),
    occurrenceId: z.string().uuid().optional(),
  }),
});

export const logideskTicketUpdatedEventSchema = platformEventEnvelopeSchema.extend({
  eventType: z.literal('ticket.updated'),
  eventVersion: z.literal(1),
  data: z.object({
    ticketId: z.string().uuid(),
    ticketNumber: z.string().min(1),
    status: z.string().min(1),
  }),
});

export type PlatformEventEnvelope = z.infer<typeof platformEventEnvelopeSchema>;
export type EmployeeOperationalStatusEvent = z.infer<typeof employeeOperationalStatusEventSchema>;
export type LogiflowOccurrenceEscalatedEvent = z.infer<typeof logiflowOccurrenceEscalatedEventSchema>;
export type LogideskTicketCreatedEvent = z.infer<typeof logideskTicketCreatedEventSchema>;
export type LogideskTicketUpdatedEvent = z.infer<typeof logideskTicketUpdatedEventSchema>;
