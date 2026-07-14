import { z } from 'zod';

export const eventIdSchema = z.string().uuid();
export const eventVersionSchema = z.number().int().positive();
export const isoDateTimeSchema = z.string().datetime({ offset: true });
export const uuidSchema = z.string().uuid();

export const platformEventEnvelopeSchema = z.object({
  eventId: eventIdSchema,
  eventType: z.string().min(1),
  eventVersion: eventVersionSchema,
  occurredAt: isoDateTimeSchema,
  producer: z.string().min(1),
  correlationId: uuidSchema,
  causationId: uuidSchema.optional(),
  idempotencyKey: z.string().min(8).max(200).optional(),
  traceparent: z.string().min(1).optional(),
  metadata: z.record(z.string(), z.unknown()).default({}),
  data: z.record(z.string(), z.unknown()),
});

const deliveryReferenceSchema = z.object({
  deliveryId: uuidSchema,
  occurrenceId: uuidSchema.optional(),
  externalReference: z.string().min(1).optional(),
});

const ticketReferenceSchema = z.object({
  ticketId: uuidSchema,
  ticketNumber: z.string().min(1),
  externalReference: z.string().min(1).optional(),
});

export const logiflowOccurrenceSeveritySchema = z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);
export const logiflowOccurrenceIntegrationStatusSchema = z.enum([
  'NOT_REQUESTED',
  'PENDING',
  'PROCESSING',
  'COMPLETED',
  'FAILED',
  'DEAD_LETTER',
]);

export const logideskTicketStatusSchema = z.enum([
  'OPEN',
  'IN_PROGRESS',
  'WAITING_CUSTOMER',
  'WAITING_INTERNAL',
  'RESOLVED',
  'CLOSED',
  'CANCELED',
]);

export const logideskTicketPrioritySchema = z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']);

export const logipeopleHrCaseStatusSchema = z.enum([
  'OPEN',
  'IN_REVIEW',
  'WAITING_EMPLOYEE',
  'WAITING_MANAGER',
  'COMPLETED',
  'CANCELED',
]);

export const logipayrollAvailabilityCategorySchema = z.enum([
  'VACATION',
  'LEAVE',
  'SICK_LEAVE',
  'TRAINING',
  'SUSPENSION',
  'TERMINATION',
]);

const platformEvent = <EventType extends string, Data extends z.ZodObject>(
  eventType: EventType,
  eventVersion: number,
  data: Data,
) =>
  platformEventEnvelopeSchema.extend({
    eventType: z.literal(eventType),
    eventVersion: z.literal(eventVersion),
    data: data.strict(),
  });

export const logiflowOccurrenceCreatedEventSchema = platformEvent(
  'logiflow.occurrence.created',
  1,
  deliveryReferenceSchema.extend({
    subject: z.string().min(3),
    description: z.string().min(3),
    severity: logiflowOccurrenceSeveritySchema,
    createdByUserId: uuidSchema,
  }),
);

export const logiflowOccurrenceEscalatedEventSchema = platformEvent(
  'logiflow.occurrence.escalated',
  1,
  deliveryReferenceSchema.extend({
    occurrenceId: uuidSchema,
    subject: z.string().min(3),
    description: z.string().min(3),
    severity: logiflowOccurrenceSeveritySchema,
    priority: logideskTicketPrioritySchema,
    requesterUserId: uuidSchema,
    requesterRole: z.string().min(1),
  }),
);

export const logiflowOccurrenceUpdatedEventSchema = platformEvent(
  'logiflow.occurrence.updated',
  1,
  deliveryReferenceSchema.extend({
    occurrenceId: uuidSchema,
    integrationStatus: logiflowOccurrenceIntegrationStatusSchema,
    ticket: ticketReferenceSchema.optional(),
    message: z.string().optional(),
  }),
);

export const logiflowDeliveryDelayedEventSchema = platformEvent(
  'logiflow.delivery.delayed',
  1,
  deliveryReferenceSchema.extend({
    reason: z.string().min(3),
    estimatedDelayMinutes: z.number().int().positive(),
  }),
);

export const logiflowDeliveryFailedEventSchema = platformEvent(
  'logiflow.delivery.failed',
  1,
  deliveryReferenceSchema.extend({
    reason: z.string().min(3),
    failedAt: isoDateTimeSchema,
  }),
);

export const logiflowVehicleMaintenanceRequiredEventSchema = platformEvent(
  'logiflow.vehicle.maintenance_required',
  1,
  z.object({
    vehicleId: uuidSchema,
    plate: z.string().min(1),
    reason: z.string().min(3),
    severity: logiflowOccurrenceSeveritySchema,
  }),
);

export const logiflowRouteDelayedEventSchema = platformEvent(
  'logiflow.route.delayed',
  1,
  z.object({
    routeId: uuidSchema,
    reason: z.string().min(3),
    estimatedDelayMinutes: z.number().int().positive(),
  }),
);

export const logideskTicketCreatedEventSchema = platformEvent(
  'logidesk.ticket.created',
  1,
  ticketReferenceSchema.extend({
    requesterUserId: uuidSchema.optional(),
    source: z.enum(['LOGIFLOW', 'LOGIDESK', 'PORTAL', 'API', 'CHATBOT']),
    deliveryId: uuidSchema.optional(),
    occurrenceId: uuidSchema.optional(),
  }),
);

export const logideskTicketAssignedEventSchema = platformEvent(
  'logidesk.ticket.assigned',
  1,
  ticketReferenceSchema.extend({
    assigneeId: uuidSchema.optional(),
    teamId: uuidSchema.optional(),
  }),
);

export const logideskTicketStatusChangedEventSchema = platformEvent(
  'logidesk.ticket.status_changed',
  1,
  ticketReferenceSchema.extend({
    previousStatus: logideskTicketStatusSchema,
    newStatus: logideskTicketStatusSchema,
    changedByUserId: uuidSchema,
  }),
);

export const logideskTicketPriorityChangedEventSchema = platformEvent(
  'logidesk.ticket.priority_changed',
  1,
  ticketReferenceSchema.extend({
    previousPriority: logideskTicketPrioritySchema,
    newPriority: logideskTicketPrioritySchema,
    changedByUserId: uuidSchema,
  }),
);

export const logideskTicketMessageCreatedEventSchema = platformEvent(
  'logidesk.ticket.message_created',
  1,
  ticketReferenceSchema.extend({
    messageId: uuidSchema,
    authorUserId: uuidSchema,
    visibility: z.enum(['PUBLIC', 'INTERNAL']),
  }),
);

export const logideskTicketResolvedEventSchema = platformEvent(
  'logidesk.ticket.resolved',
  1,
  ticketReferenceSchema.extend({
    resolvedByUserId: uuidSchema,
    resolutionSummary: z.string().min(3),
  }),
);

export const logideskTicketClosedEventSchema = platformEvent(
  'logidesk.ticket.closed',
  1,
  ticketReferenceSchema.extend({
    closedByUserId: uuidSchema,
  }),
);

export const logideskTicketSlaWarningEventSchema = platformEvent(
  'logidesk.ticket.sla_warning',
  1,
  ticketReferenceSchema.extend({
    deadlineAt: isoDateTimeSchema,
    remainingMinutes: z.number().int().min(0),
  }),
);

export const logideskTicketSlaBreachedEventSchema = platformEvent(
  'logidesk.ticket.sla_breached',
  1,
  ticketReferenceSchema.extend({
    breachedAt: isoDateTimeSchema,
    breachType: z.enum(['FIRST_RESPONSE', 'RESOLUTION']),
  }),
);

export const logideskHrCaseCreatedEventSchema = platformEvent(
  'logidesk.hr_case.created',
  1,
  ticketReferenceSchema.extend({
    requesterUserId: uuidSchema,
    category: z.enum(['HR_QUESTION', 'DOCUMENT_REQUEST', 'ONBOARDING', 'TRAINING', 'PROFILE_UPDATE', 'MANAGER_REQUEST']),
    summary: z.string().min(3),
  }),
);

export const logideskHrCaseUpdatedEventSchema = platformEvent(
  'logidesk.hr_case.updated',
  1,
  ticketReferenceSchema.extend({
    hrCaseId: uuidSchema,
    status: logipeopleHrCaseStatusSchema,
  }),
);

export const logideskOnboardingRequestCreatedEventSchema = platformEvent(
  'logidesk.onboarding_request.created',
  1,
  ticketReferenceSchema.extend({
    employeeId: uuidSchema,
    requestedByUserId: uuidSchema,
  }),
);

export const logideskTrainingRequestCreatedEventSchema = platformEvent(
  'logidesk.training_request.created',
  1,
  ticketReferenceSchema.extend({
    employeeId: uuidSchema,
    trainingId: uuidSchema.optional(),
    requestedByUserId: uuidSchema,
  }),
);

export const logipeopleHrCaseCreatedEventSchema = platformEvent(
  'logipeople.hr_case.created',
  1,
  z.object({
    hrCaseId: uuidSchema,
    ticketId: uuidSchema.optional(),
    ownerUserId: uuidSchema.optional(),
    status: logipeopleHrCaseStatusSchema,
  }),
);

export const logipeopleHrCaseStatusChangedEventSchema = platformEvent(
  'logipeople.hr_case.status_changed',
  1,
  z.object({
    hrCaseId: uuidSchema,
    previousStatus: logipeopleHrCaseStatusSchema,
    newStatus: logipeopleHrCaseStatusSchema,
  }),
);

export const logipeopleEmployeeOperationalEligibilityChangedEventSchema = platformEvent(
  'logipeople.employee.operational_eligibility_changed',
  1,
  z.object({
    employeeId: uuidSchema,
    eligible: z.boolean(),
    reason: z.string().min(3),
    effectiveAt: isoDateTimeSchema,
  }),
);

export const logipeopleEmployeeHiredEventSchema = platformEvent(
  'logipeople.employee.hired',
  1,
  z.object({
    employeeId: uuidSchema,
    personId: uuidSchema,
    startDate: z.string().date(),
  }),
);

export const logipeopleEmployeeUpdatedEventSchema = platformEvent(
  'logipeople.employee.updated',
  1,
  z.object({
    employeeId: uuidSchema,
    changedFields: z.array(z.string().min(1)).min(1),
  }),
);

export const logipeopleEmployeeTerminatedEventSchema = platformEvent(
  'logipeople.employee.terminated',
  1,
  z.object({
    employeeId: uuidSchema,
    terminatedAt: z.string().date(),
  }),
);

export const logipayrollContractCreatedDataSchema = z.object({
  contractId: uuidSchema,
  employeeId: uuidSchema,
  identityUserId: uuidSchema.nullable(),
  logiPeopleId: uuidSchema.nullable(),
  startsAt: isoDateTimeSchema,
  endsAt: isoDateTimeSchema.nullable(),
  status: z.enum(['ACTIVE', 'SUSPENDED', 'ENDED']),
});

export const logipayrollContractCreatedEventSchema = platformEvent(
  'logipayroll.contract.created',
  1,
  logipayrollContractCreatedDataSchema,
);

export const logipayrollLeaveApprovedEventSchema = platformEvent(
  'logipayroll.leave.approved',
  1,
  z.object({
    employeeId: uuidSchema,
    unavailableFrom: isoDateTimeSchema,
    unavailableUntil: isoDateTimeSchema,
    category: logipayrollAvailabilityCategorySchema,
  }),
);

export const logipayrollEmployeeUnavailableEventSchema = platformEvent(
  'logipayroll.employee.unavailable',
  1,
  z.object({
    employeeId: uuidSchema,
    unavailableFrom: isoDateTimeSchema,
    unavailableUntil: isoDateTimeSchema.optional(),
    category: logipayrollAvailabilityCategorySchema,
  }),
);

export const logipayrollEmployeeAvailableEventSchema = platformEvent(
  'logipayroll.employee.available',
  1,
  z.object({
    employeeId: uuidSchema,
    availableFrom: isoDateTimeSchema,
  }),
);

export const platformEventSchemas = [
  logiflowOccurrenceCreatedEventSchema,
  logiflowOccurrenceEscalatedEventSchema,
  logiflowOccurrenceUpdatedEventSchema,
  logiflowDeliveryDelayedEventSchema,
  logiflowDeliveryFailedEventSchema,
  logiflowVehicleMaintenanceRequiredEventSchema,
  logiflowRouteDelayedEventSchema,
  logideskTicketCreatedEventSchema,
  logideskTicketAssignedEventSchema,
  logideskTicketStatusChangedEventSchema,
  logideskTicketPriorityChangedEventSchema,
  logideskTicketMessageCreatedEventSchema,
  logideskTicketResolvedEventSchema,
  logideskTicketClosedEventSchema,
  logideskTicketSlaWarningEventSchema,
  logideskTicketSlaBreachedEventSchema,
  logideskHrCaseCreatedEventSchema,
  logideskHrCaseUpdatedEventSchema,
  logideskOnboardingRequestCreatedEventSchema,
  logideskTrainingRequestCreatedEventSchema,
  logipeopleHrCaseCreatedEventSchema,
  logipeopleHrCaseStatusChangedEventSchema,
  logipeopleEmployeeOperationalEligibilityChangedEventSchema,
  logipeopleEmployeeHiredEventSchema,
  logipeopleEmployeeUpdatedEventSchema,
  logipeopleEmployeeTerminatedEventSchema,
  logipayrollContractCreatedEventSchema,
  logipayrollLeaveApprovedEventSchema,
  logipayrollEmployeeUnavailableEventSchema,
  logipayrollEmployeeAvailableEventSchema,
] as const;

export const platformEventSchema = z.union(platformEventSchemas);

const platformEventTypeValues = platformEventSchemas.map((schema) => schema.shape.eventType.value) as [
  PlatformEventTypeLiteral,
  ...PlatformEventTypeLiteral[],
];

export const platformEventTypeSchema = z.enum(platformEventTypeValues);

export function parsePlatformEvent(input: unknown) {
  return platformEventSchema.parse(input);
}

export function safeParsePlatformEvent(input: unknown) {
  return platformEventSchema.safeParse(input);
}

export type PlatformEventEnvelope = z.infer<typeof platformEventEnvelopeSchema>;
export type PlatformEvent = z.infer<typeof platformEventSchema>;
export type PlatformEventType = z.infer<typeof platformEventTypeSchema>;
type PlatformEventTypeLiteral = (typeof platformEventSchemas)[number]['shape']['eventType']['value'];
export type LogiflowOccurrenceEscalatedEvent = z.infer<typeof logiflowOccurrenceEscalatedEventSchema>;
export type LogideskTicketCreatedEvent = z.infer<typeof logideskTicketCreatedEventSchema>;
export type LogideskTicketStatusChangedEvent = z.infer<typeof logideskTicketStatusChangedEventSchema>;
export type LogipeopleEmployeeOperationalEligibilityChangedEvent = z.infer<
  typeof logipeopleEmployeeOperationalEligibilityChangedEventSchema
>;
export type LogipayrollContractCreatedEvent = z.infer<typeof logipayrollContractCreatedEventSchema>;
export type LogipayrollLeaveApprovedEvent = z.infer<typeof logipayrollLeaveApprovedEventSchema>;
