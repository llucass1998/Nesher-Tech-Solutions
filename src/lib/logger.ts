import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'headers.authorization',
      'headers.cookie',
      'password',
      'passwordHash',
      'refreshToken',
      'refreshTokenHash',
      'token',
      '*.password',
      '*.passwordHash',
      '*.refreshToken',
      '*.token',
    ],
    censor: '[REDACTED]',
  },
});
