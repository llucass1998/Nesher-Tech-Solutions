import { describe, expect, it, vi } from 'vitest';
import { PayrollService } from './payroll.service';

function createContractRecord() {
  return {
    id: 'contract-1',
    employeeId: 'employee-1',
    type: 'CLT',
    startsAt: new Date('2026-07-14T00:00:00.000Z'),
    endsAt: null,
    status: 'ACTIVE',
    createdAt: new Date('2026-07-14T01:00:00.000Z'),
    updatedAt: new Date('2026-07-14T01:00:00.000Z'),
    employee: {
      id: 'employee-1',
      identityUserId: 'identity-user-1',
      logiPeopleId: '11111111-1111-4111-8111-111111111111',
      fullName: 'Employee One',
      documentHash: 'hash-only',
      status: 'ACTIVE',
      createdAt: new Date('2026-07-14T01:00:00.000Z'),
      updatedAt: new Date('2026-07-14T01:00:00.000Z'),
    },
  };
}

describe('PayrollService contracts', () => {
  it('lists contracts without exposing document hashes', async () => {
    const prisma = {
      contract: {
        findMany: vi.fn().mockResolvedValue([createContractRecord()]),
      },
    };
    const service = new PayrollService(prisma as never);

    await expect(service.listContracts()).resolves.toEqual([expect.objectContaining({
      id: 'contract-1',
      employee: expect.not.objectContaining({ documentHash: 'hash-only' }),
    })]);
  });

  it('creates a contract and writes an outbox event without sensitive payroll data', async () => {
    const employee = createContractRecord().employee;
    const contract = createContractRecord();
    const outboxCreate = vi.fn();
    const tx = {
      payrollEmployeeReference: {
        upsert: vi.fn().mockResolvedValue(employee),
        create: vi.fn(),
      },
      contract: {
        create: vi.fn().mockResolvedValue(contract),
      },
      outboxEvent: {
        create: outboxCreate,
      },
    };
    const prisma = {
      $transaction: vi.fn(async (callback: (txClient: typeof tx) => Promise<unknown>) => callback(tx)),
    };
    const service = new PayrollService(prisma as never);

    const response = await service.createContract({
      employee: {
        logiPeopleId: '11111111-1111-4111-8111-111111111111',
        identityUserId: 'identity-user-1',
        fullName: 'Employee One',
        documentHash: 'hash-only',
      },
      type: 'CLT',
      startsAt: '2026-07-14T00:00:00.000Z',
    }, {
      sub: 'payroll-admin-1',
      email: 'payroll@example.com',
      name: 'Payroll Admin',
      roles: ['PAYROLL_ADMIN'],
      sessionId: 'session-1',
    }, 'corr-1');

    expect(response.employee).not.toHaveProperty('documentHash');
    expect(outboxCreate).toHaveBeenCalledWith({
      data: {
        eventType: 'logipayroll.contract.created',
        eventVersion: 1,
        correlationId: 'corr-1',
        causationId: 'session-1',
        payload: expect.not.objectContaining({
          documentHash: 'hash-only',
          salary: expect.anything(),
          amountCents: expect.anything(),
        }),
      },
    });
  });
});
