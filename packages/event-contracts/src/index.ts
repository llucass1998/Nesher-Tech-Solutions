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

export type PlatformEventEnvelope = z.infer<typeof platformEventEnvelopeSchema>;
export type EmployeeOperationalStatusEvent = z.infer<typeof employeeOperationalStatusEventSchema>;
