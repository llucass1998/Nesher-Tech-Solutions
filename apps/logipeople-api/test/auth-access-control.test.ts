import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { ExecutionContext } from '@nestjs/common';
import jwt from 'jsonwebtoken';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthenticatedPrincipal } from '@logipeople/auth';
import { AbacGuard } from '../src/modules/access-control/abac.guard';
import { FieldAccessGuard } from '../src/modules/access-control/field-access.guard';
import { RbacGuard } from '../src/modules/access-control/rbac.guard';
import { AuthenticatedRequest } from '../src/modules/auth/authenticated-request';
import { TokenVerifier } from '../src/modules/auth/token-verifier.service';

type MetadataValue = string[] | undefined;

class TestReflector {
  constructor(private readonly value: MetadataValue) {}

  getAllAndOverride<T>() {
    return this.value as T;
  }
}

function createContext(request: Partial<AuthenticatedRequest>): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
    getHandler: () => undefined,
    getClass: () => undefined,
  } as unknown as ExecutionContext;
}

const principal: AuthenticatedPrincipal = {
  userId: 'user-1',
  employeeId: 'employee-1',
  roles: ['PEOPLE_ADMIN'],
  scopes: [{ type: 'COMPANY', id: 'company-1' }],
};

describe('LogiPeople authentication and access control', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  it('rejects JWT validation when identity secret is not configured', () => {
    const verifier = new TokenVerifier();

    expect(() => verifier.verify('token')).toThrow(UnauthorizedException);
  });

  it('validates JWT claims from LogiIdentity configuration', () => {
    vi.stubEnv('LOGIIDENTITY_JWT_SECRET', 'test-logiidentity-secret');
    vi.stubEnv('LOGIIDENTITY_ISSUER', 'logiidentity.test');
    vi.stubEnv('LOGIIDENTITY_AUDIENCE', 'logipeople');

    const token = jwt.sign(
      {
        sub: 'user-1',
        employeeId: 'employee-1',
        roles: ['PEOPLE_ADMIN'],
        scopes: [{ type: 'COMPANY', id: 'company-1' }],
      },
      'test-logiidentity-secret',
      { issuer: 'logiidentity.test', audience: 'logipeople' },
    );

    expect(new TokenVerifier().verify(token)).toEqual(principal);
  });

  it('allows requests when RBAC role matches', () => {
    const guard = new RbacGuard(new TestReflector(['PEOPLE_ADMIN']) as never);
    const context = createContext({ principal });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('rejects requests when RBAC role does not match', () => {
    const guard = new RbacGuard(new TestReflector(['PAYROLL_MANAGER']) as never);
    const context = createContext({ principal });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('allows requests when ABAC company scope matches the body', () => {
    const guard = new AbacGuard(new TestReflector(['COMPANY']) as never);
    const context = createContext({ principal, body: { companyId: 'company-1' }, params: {} });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('allows time managers to access time attendance endpoints', () => {
    const timeManagerPrincipal: AuthenticatedPrincipal = {
      ...principal,
      roles: ['TIME_MANAGER'],
    };
    const guard = new RbacGuard(new TestReflector(['TIME_MANAGER']) as never);
    const context = createContext({ principal: timeManagerPrincipal });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('allows payroll managers to access payroll endpoints', () => {
    const payrollManagerPrincipal: AuthenticatedPrincipal = {
      ...principal,
      roles: ['PAYROLL_MANAGER'],
    };
    const guard = new RbacGuard(new TestReflector(['PAYROLL_MANAGER']) as never);
    const context = createContext({ principal: payrollManagerPrincipal });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('allows benefits analysts to access benefits endpoints', () => {
    const benefitsPrincipal: AuthenticatedPrincipal = {
      ...principal,
      roles: ['BENEFITS_ANALYST'],
    };
    const guard = new RbacGuard(new TestReflector(['BENEFITS_ANALYST']) as never);
    const context = createContext({ principal: benefitsPrincipal });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('rejects requests when ABAC company scope differs from the body', () => {
    const guard = new AbacGuard(new TestReflector(['COMPANY']) as never);
    const context = createContext({ principal, body: { companyId: 'company-2' }, params: {} });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('allows payroll roles to access salary fields', () => {
    const payrollPrincipal: AuthenticatedPrincipal = {
      ...principal,
      roles: ['PAYROLL_MANAGER'],
    };
    const guard = new FieldAccessGuard(new TestReflector(['salary']) as never);
    const context = createContext({ principal: payrollPrincipal });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('rejects managers from salary fields without explicit permission', () => {
    const managerPrincipal: AuthenticatedPrincipal = {
      ...principal,
      roles: ['MANAGER'],
    };
    const guard = new FieldAccessGuard(new TestReflector(['salary']) as never);
    const context = createContext({ principal: managerPrincipal });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});
