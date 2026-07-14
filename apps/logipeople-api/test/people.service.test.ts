import { describe, expect, it, vi } from 'vitest';
import { PeopleService } from '../src/modules/people/people.service';

function createPeopleService() {
  const employeeCreate = vi.fn().mockResolvedValue({
    id: '11111111-1111-4111-8111-111111111111',
    employeeNumber: 'LP-100',
    companyId: '33333333-3333-4333-8333-333333333333',
  });
  const employeeStatusHistoryCreate = vi.fn().mockResolvedValue({ id: 'status-1' });
  const employmentHistoryCreate = vi.fn().mockResolvedValue({ id: 'history-1' });
  const positionAssignmentCreate = vi.fn().mockResolvedValue({ id: 'position-assignment-1' });
  const outboxEventCreate = vi.fn().mockResolvedValue({ id: 'outbox-1' });

  const prisma = {
    person: {
      findUnique: vi.fn().mockResolvedValue({ id: '22222222-2222-4222-8222-222222222222' }),
      findMany: vi.fn(),
      create: vi.fn(),
    },
    company: {
      findUnique: vi.fn().mockResolvedValue({ id: '33333333-3333-4333-8333-333333333333' }),
    },
    position: {
      findUnique: vi.fn().mockResolvedValue({ id: '44444444-4444-4444-8444-444444444444' }),
    },
    employee: {
      create: employeeCreate,
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
    employeeStatusHistory: {
      create: employeeStatusHistoryCreate,
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
    employmentHistory: {
      create: employmentHistoryCreate,
      findMany: vi.fn(),
    },
    positionAssignment: {
      create: positionAssignmentCreate,
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
    departmentAssignment: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
    managerAssignment: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
    costCenterAssignment: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
    compensationHistory: {
      findMany: vi.fn(),
    },
    outboxEvent: {
      create: outboxEventCreate,
    },
    $transaction: vi.fn(async (callback: (tx: typeof prisma) => Promise<unknown>) => callback(prisma)),
  };

  const audit = {
    record: vi.fn().mockResolvedValue(undefined),
    recordSensitiveAccess: vi.fn().mockResolvedValue(undefined),
  };

  return {
    service: new PeopleService(prisma as never, audit as never),
    prisma,
    audit,
    employeeCreate,
    employeeStatusHistoryCreate,
    employmentHistoryCreate,
    positionAssignmentCreate,
    outboxEventCreate,
  };
}

describe('PeopleService', () => {
  it('creates employee with effective-dated status, history and position assignment', async () => {
    const context = createPeopleService();

    await expect(
      context.service.createEmployee(
        {
          personId: '22222222-2222-4222-8222-222222222222',
          companyId: '33333333-3333-4333-8333-333333333333',
          positionId: '44444444-4444-4444-8444-444444444444',
          employeeNumber: 'LP-100',
          hireDate: '2026-01-15',
        },
        {
          userId: '55555555-5555-4555-8555-555555555555',
          roles: ['PEOPLE_ADMIN'],
          scopes: [{ type: 'COMPANY', id: 'company-1' }],
        },
      ),
    ).resolves.toMatchObject({ id: '11111111-1111-4111-8111-111111111111', employeeNumber: 'LP-100' });

    expect(context.employeeCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          employeeNumber: 'LP-100',
          status: 'ACTIVE',
        }),
      }),
    );
    expect(context.employeeStatusHistoryCreate).toHaveBeenCalledOnce();
    expect(context.employmentHistoryCreate).toHaveBeenCalledOnce();
    expect(context.positionAssignmentCreate).toHaveBeenCalledOnce();
    expect(context.audit.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'people.employee.created',
        entityType: 'Employee',
        entityId: '11111111-1111-4111-8111-111111111111',
      }),
    );
    expect(context.outboxEventCreate).toHaveBeenCalledWith({
      data: {
        eventType: 'logipeople.employee.hired',
        eventVersion: 1,
        causationId: '55555555-5555-4555-8555-555555555555',
        payload: {
          employeeId: '11111111-1111-4111-8111-111111111111',
          personId: '22222222-2222-4222-8222-222222222222',
          startDate: '2026-01-15',
        },
      },
    });
    const outboxCall = context.outboxEventCreate.mock.calls[0]?.[0];
    expect(outboxCall).toBeDefined();
    expect(outboxCall.data.payload).not.toHaveProperty('salary');
    expect(outboxCall.data.payload).not.toHaveProperty('document');
  });
});
