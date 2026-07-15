const fs = require('fs');

let content = fs.readFileSync('apps/logipayroll-api/src/modules/payroll/payroll.service.ts', 'utf8');

const additionalMethods = `
  async listTimeRecords() {
    return this.prisma.timeRecord.findMany({
      orderBy: { timestamp: 'desc' },
      include: { employee: true },
    });
  }

  async createTimeRecord(input: any, claims: LogiIdentityClaims, correlationId?: string) {
    return this.prisma.timeRecord.create({
      data: {
        employeeId: input.employeeId,
        kind: input.kind,
        timestamp: new Date(input.timestamp),
      },
    });
  }

  async listLeaveRequests() {
    return this.prisma.leaveRequest.findMany({
      orderBy: { createdAt: 'desc' },
      include: { employee: true },
    });
  }

  async createLeaveRequest(input: any, claims: LogiIdentityClaims, correlationId?: string) {
    return this.prisma.leaveRequest.create({
      data: {
        employeeId: input.employeeId,
        startDate: new Date(input.startDate),
        endDate: new Date(input.endDate),
        category: input.category,
        reason: input.reason,
        status: 'REQUESTED',
      },
    });
  }

  async approveLeaveRequest(id: string, claims: LogiIdentityClaims, correlationId?: string) {
    const request = await this.prisma.leaveRequest.update({
      where: { id },
      data: { status: 'APPROVED' },
    });

    const eventPayload = logipayrollLeaveApprovedEventSchema.shape.data.parse({
      employeeId: request.employeeId,
      unavailableFrom: request.startDate.toISOString(),
      unavailableUntil: request.endDate.toISOString(),
      category: request.category as any,
    });

    await this.prisma.outboxEvent.create({
      data: {
        eventType: 'logipayroll.leave.approved',
        eventVersion: 1,
        correlationId: correlationId ?? null,
        causationId: claims.sessionId ?? null,
        payload: eventPayload as unknown as Prisma.InputJsonValue,
      },
    });

    await this.prisma.outboxEvent.create({
      data: {
        eventType: 'logipayroll.employee.unavailable',
        eventVersion: 1,
        correlationId: correlationId ?? null,
        causationId: claims.sessionId ?? null,
        payload: eventPayload as unknown as Prisma.InputJsonValue,
      },
    });

    return request;
  }
`;

content = content.replace('private publicContract', additionalMethods + '\n  private publicContract');
fs.writeFileSync('apps/logipayroll-api/src/modules/payroll/payroll.service.ts', content);
