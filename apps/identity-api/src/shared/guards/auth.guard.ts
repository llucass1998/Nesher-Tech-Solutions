import { CanActivate, ExecutionContext, Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import jwt from 'jsonwebtoken';
import { getIdentityPublicKey } from '../../modules/auth/key-store';
import { IdentityClaims } from '../../modules/auth/auth.service';

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid Authorization header');
    }

    try {
      const token = authHeader.substring(7);
      const claims = jwt.verify(token, getIdentityPublicKey(), {
        algorithms: ['RS256'],
        issuer: process.env.IDENTITY_ISSUER || 'logiidentity',
      }) as IdentityClaims;
      
      (request as any).user = claims;
      return true;
    } catch (err) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.get<string[]>('permissions', context.getHandler());
    if (!requiredPermissions) {
      return true; // No specific permissions required
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as IdentityClaims;

    if (!user) throw new UnauthorizedException();

    const hasPermission = requiredPermissions.some((p) => user.permissions?.includes(p));
    if (!hasPermission) {
      throw new ForbiddenException('Insufficient permissions');
    }
    return true;
  }
}
