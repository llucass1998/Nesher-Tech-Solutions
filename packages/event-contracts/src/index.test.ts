import { describe, expect, it } from 'vitest';
import {
  logideskTicketCreatedEventSchema,
  logiflowOccurrenceEscalatedEventSchema,
  logipayrollLeaveApprovedEventSchema,
  parsePlatformEvent,
  platformEventTypeSchema,
} from './index.js';

const ids = {
  eventId: '11111111-1111-4111-8111-111111111111',
  correlationId: '22222222-2222-4222-8222-222222222222',
  causationId: '33333333-3333-4333-8333-333333333333',
  deliveryId: '44444444-4444-4444-8444-444444444444',
  occurrenceId: '55555555-5555-4555-8555-555555555555',
  userId: '66666666-6666-4666-8666-666666666666',
  ticketId: '77777777-7777-4777-8777-777777777777',
  employeeId: '88888888-8888-4888-8888-888888888888',
};

const baseEnvelope = {
  eventId: ids.eventId,
  eventVersion: 1,
  occurredAt: '2026-07-14T03:00:00.000Z',
  producer: 'contract-test',
  correlationId: ids.correlationId,
  causationId: ids.causationId,
  idempotencyKey: 'contract-test-key',
  traceparent: '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-00',
};

describe('platform event contracts', () => {
  it('accepts a LogiFlow occurrence escalation event', () => {
    const event = logiflowOccurrenceEscalatedEventSchema.parse({
      ...baseEnvelope,
      eventType: 'logiflow.occurrence.escalated',
      data: {
        deliveryId: ids.deliveryId,
        occurrenceId: ids.occurrenceId,
        subject: 'Entrega atrasada',
        description: 'Motorista reportou bloqueio na rota.',
        severity: 'HIGH',
        priority: 'URGENT',
        requesterUserId: ids.userId,
        requesterRole: 'OPERATOR',
      },
    });

    expect(event.eventType).toBe('logiflow.occurrence.escalated');
    expect(event.data.priority).toBe('URGENT');
  });

  it('accepts a LogiDesk ticket created event', () => {
    const event = parsePlatformEvent({
      ...baseEnvelope,
      eventType: 'logidesk.ticket.created',
      data: {
        ticketId: ids.ticketId,
        ticketNumber: 'LD-000001',
        requesterUserId: ids.userId,
        source: 'LOGIFLOW',
        deliveryId: ids.deliveryId,
        occurrenceId: ids.occurrenceId,
      },
    });

    expect(event).toEqual(expect.objectContaining({ eventType: 'logidesk.ticket.created' }));
  });

  it('rejects old non-namespaced LogiDesk event names', () => {
    const result = logideskTicketCreatedEventSchema.safeParse({
      ...baseEnvelope,
      eventType: 'ticket.created',
      data: {
        ticketId: ids.ticketId,
        ticketNumber: 'LD-000001',
        source: 'LOGIFLOW',
      },
    });

    expect(result.success).toBe(false);
  });

  it('rejects payroll unavailability events with restricted payroll details', () => {
    const result = logipayrollLeaveApprovedEventSchema.safeParse({
      ...baseEnvelope,
      eventType: 'logipayroll.leave.approved',
      data: {
        employeeId: ids.employeeId,
        unavailableFrom: '2026-07-20T00:00:00.000Z',
        unavailableUntil: '2026-08-01T00:00:00.000Z',
        category: 'VACATION',
        salaryAmount: '10000.00',
        bankAccount: '12345-6',
      },
    });

    expect(result.success).toBe(false);
  });

  it('lists the expected platform event type literals', () => {
    expect(platformEventTypeSchema.options).toContain('logiflow.occurrence.escalated');
    expect(platformEventTypeSchema.options).toContain('logidesk.ticket.status_changed');
    expect(platformEventTypeSchema.options).toContain('logipeople.employee.operational_eligibility_changed');
    expect(platformEventTypeSchema.options).toContain('logipayroll.leave.approved');
  });
});
