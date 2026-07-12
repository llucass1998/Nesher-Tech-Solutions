import pino from 'pino';

export const sensitiveLogPaths = [
  'req.headers.authorization',
  'req.headers.cookie',
  'password',
  'token',
  'cookie',
  'bankAccount',
  'salary',
  'document',
  'medicalInformation',
  'biometrics',
  'certificate',
  'privateKey',
] as const;

export function createPlatformLogger(service: string) {
  return pino({
    name: service,
    redact: {
      paths: [...sensitiveLogPaths],
      censor: '[REDACTED]',
    },
    base: {
      service,
    },
  });
}
