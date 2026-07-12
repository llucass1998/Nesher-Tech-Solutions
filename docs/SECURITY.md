# Security

## Principles for LogiPeople phases 1-6

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
