import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthenticatedRequest } from './authenticated-request';
import { TokenVerifier } from './token-verifier.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly tokenVerifier: TokenVerifier) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authorization = request.headers.authorization;

    if (!authorization) {
      throw new UnauthorizedException({ error: 'Token não fornecido.' });
    }

    const [scheme, token] = authorization.split(' ');

    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedException({ error: 'Token inválido.' });
    }

    request.principal = this.tokenVerifier.verify(token);
    return true;
  }
}
