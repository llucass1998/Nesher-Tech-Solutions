import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  async ready() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ok', checks: { api: 'ok', prisma: 'ok', postgres: 'ok' } };
    } catch {
      throw new ServiceUnavailableException({ status: 'unavailable', checks: { postgres: 'failed' } });
    }
  }
}
