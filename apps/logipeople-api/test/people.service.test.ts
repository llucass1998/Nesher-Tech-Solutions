import { describe, expect, it, vi } from 'vitest';
import { PeopleService } from '../src/modules/people/people.service';

function createPeopleService() {
  const employeeCreate = vi.fn().mockResolvedValue({
    id: 'employee-1',
    employeeNumber: 'LP-100',
    companyId: 'company-1',
  });
  const employeeStatusHistoryCreate = vi.fn().mockResolvedValue({ id: 'status-1' });
  const employmentHistoryCreate = vi.fn().mockResolvedValue({ id: 'history-1' });
  const positionAssignmentCreate = vi.fn().mockResolvedValue({ id: 'position-assignment-1' });

  const prisma = {
    person: {
      findUnique: vi.fn().mockResolvedValue({ id: 'person-1' }),
      findMany: vi.fn(),
      create: vi.fn(),
    },
    company: {
      findUnique: vi.fn().mockResolvedValue({ id: 'company-1' }),
    },
    position: {
      findUnique: vi.fn().mockResolvedValue({ id: 'position-1' }),
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
  };
}

describe('PeopleService', () => {
  it('creates employee with effective-dated status, history and position assignment', async () => {
    const context = createPeopleService();

    await expect(
      context.service.createEmployee(
        {
          personId: 'person-1',
          companyId: 'company-1',
          positionId: 'position-1',
          employeeNumber: 'LP-100',
          hireDate: '2026-01-15',
        },
        {
          userId: 'user-1',
          roles: ['PEOPLE_ADMIN'],
          scopes: [{ type: 'COMPANY', id: 'company-1' }],
        },
      ),
    ).resolves.toMatchObject({ id: 'employee-1', employeeNumber: 'LP-100' });

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
        entityId: 'employee-1',
      }),
    );
  });
});
