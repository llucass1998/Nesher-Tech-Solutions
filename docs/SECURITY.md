# Security

## Platform principles

- Sensitive values must come from environment variables.
- Do not commit real secrets.
- `.env.example` must contain placeholders only.
- Logs must redact tokens, cookies, passwords and hashes.
- `npm audit` must remain at 0 known vulnerabilities unless an exception is explicitly approved.

## LogiPeople principles

- Sensitive values must come from environment variables.
- Salary, bank data, documents, medical data, biometrics and confidential evaluations require field-level controls.
- Access must combine authentication, role checks and scoped ABAC checks.
- Employee self-service access must be limited to the authenticated employee's own records.
- Manager access must be scoped to authorized teams or subordinates.
- Technical support and logistics systems must not access payroll or sensitive HR records.

## Initial data classifications

- `PUBLIC`
- `INTERNAL`
- `CONFIDENTIAL`
- `SENSITIVE`
- `RESTRICTED`

## Audit-sensitive events

- Access to sensitive fields.
- Changes to employment contracts.
- Changes to compensation history.
- Changes to documents.
- Permission changes.
- Data exports.

## Deferred security work

Full rate limiting, OpenTelemetry, storage scanning, encrypted backups and complete incident workflows are future phases and must be validated before production.

## LogiFlow Docker/runtime hardening

- Do not commit real secrets. `.env.example` must contain placeholders only.
- Runtime secrets must come from environment variables, especially database password, JWT secret and payment API key.
- Docker Compose must fail fast when required secrets are absent.
- API and web containers must run as a non-root user.
- API must keep `helmet` enabled before route handling.
- CORS origin must be configured by `WEB_ORIGIN`, not hard-coded for production.
- Host ports must be configurable through environment variables to avoid local and CI collisions.
- A container in `running` state is not enough: health checks and logs must be verified.
- API startup in Docker must be gated by successful `prisma migrate deploy`.
- High-severity dependency audit failures must block CI.
- Dependency audit must remain at 0 known vulnerabilities unless a documented exception is explicitly approved.

## Service-to-service future guardrails

- Use HMAC or signed service tokens for service calls.
- Require idempotency keys for integration commands.
- Require correlation IDs across systems.
- Never log service tokens, API keys or full payloads with sensitive fields.
