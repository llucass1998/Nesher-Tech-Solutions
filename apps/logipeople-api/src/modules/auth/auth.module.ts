import { Module } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';
import { TokenVerifier } from './token-verifier.service';

@Module({
  providers: [JwtAuthGuard, TokenVerifier],
  exports: [JwtAuthGuard, TokenVerifier],
})
export class AuthModule {}
