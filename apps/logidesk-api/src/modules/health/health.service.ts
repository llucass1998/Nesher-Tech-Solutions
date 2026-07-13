import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  live() {
    return { status: 'ok', service: 'logidesk-api' };
  }

  async ready() {
    await this.prisma.$queryRaw`SELECT 1`;
    return { status: 'ok', checks: { api: 'ok', prisma: 'ok', postgres: 'ok' } };
  }
}
