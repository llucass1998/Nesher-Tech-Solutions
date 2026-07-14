import { Injectable } from '@nestjs/common';

@Injectable()
export class HealthService {
  live() {
    return {
      status: 'ok',
      service: 'logipayroll-api',
    };
  }

  ready() {
    return {
      status: 'ok',
      checks: {
        api: 'ok',
        databaseConfigured: Boolean(process.env.LOGIPAYROLL_DATABASE_URL),
      },
    };
  }
}
