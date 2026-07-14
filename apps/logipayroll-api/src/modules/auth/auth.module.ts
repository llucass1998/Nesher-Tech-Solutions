import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { IdentityJwksService } from './identity-jwks.service';

@Module({
  controllers: [AuthController],
  providers: [IdentityJwksService],
  exports: [IdentityJwksService],
})
export class AuthModule {}
