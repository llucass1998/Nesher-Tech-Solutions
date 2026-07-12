import { z } from 'zod';

export const logiPeopleEnvironmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  LOGIPEOPLE_PORT: z.coerce.number().int().positive().default(3433),
  LOGIPEOPLE_DATABASE_URL: z.string().min(1),
  LOGIIDENTITY_ISSUER: z.string().min(1).default('logiidentity.local'),
  LOGIIDENTITY_AUDIENCE: z.string().min(1).default('logipeople'),
  LOGIIDENTITY_JWT_SECRET: z.string().min(16).optional(),
  LOGIIDENTITY_JWKS_URL: z.string().url().optional(),
  ESOCIAL_ENABLED: z.enum(['true', 'false']).default('false'),
  ESOCIAL_ENVIRONMENT: z.enum(['restricted', 'production']).default('restricted'),
  ESOCIAL_LAYOUT_VERSION: z.string().default('S-1.3'),
});

export type LogiPeopleEnvironment = z.infer<typeof logiPeopleEnvironmentSchema>;

export function parseLogiPeopleEnvironment(input: NodeJS.ProcessEnv): LogiPeopleEnvironment {
  return logiPeopleEnvironmentSchema.parse(input);
}
