import { Controller, Get, Headers } from '@nestjs/common';
import { IdentityJwksService } from './identity-jwks.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly identityJwks: IdentityJwksService) {}

  @Get('me')
  async me(@Headers('authorization') authorization?: string) {
    const claims = await this.identityJwks.verifyAuthorizationHeader(authorization);

    return {
      user: {
        id: claims.sub,
        name: claims.name,
        email: claims.email,
        roles: claims.roles ?? [],
        permissions: claims.permissions ?? [],
        status: claims.status ?? 'ACTIVE',
      },
    };
  }
}
