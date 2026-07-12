import { Module } from '@nestjs/common';
import { AbacGuard } from './abac.guard';
import { FieldAccessGuard } from './field-access.guard';
import { RbacGuard } from './rbac.guard';

@Module({
  providers: [AbacGuard, FieldAccessGuard, RbacGuard],
  exports: [AbacGuard, FieldAccessGuard, RbacGuard],
})
export class AccessControlModule {}
