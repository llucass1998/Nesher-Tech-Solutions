import { Controller, Get } from '@nestjs/common';
import { HealthService } from './health.service';

@Controller('api/v1/health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get('live')
  live() {
    return { status: 'ok', service: 'identity-api' };
  }

  @Get('ready')
  ready() {
    return this.healthService.ready();
  }
}
