# Implementation status

## Scope for this execution

Phases 1-14 are in scope:

1. Study and diagnosis.
2. Reference and license documentation.
3. LogiPeople structure.
4. Database and migrations.
5. LogiIdentity integration boundary.
6. Organization and Core People.
7. Time and Attendance foundation.
8. Payroll foundation.
9. Benefits foundation.
10. Absence and Vacation foundation.
11. Recruitment foundation.
12. Onboarding foundation.
13. Analytics foundation.
14. Preliminary payslip foundation.

## Current status

| Area | Status | Notes |
| --- | --- | --- |
| LogiFlow preservation | In progress | Existing Express and Next.js structure remains in place. |
| LogiPeople workspace | Implemented | Apps and packages were added under `apps/` and `packages/`. |
| Documentation | Implemented | Architecture, domains, references and legal caveats are documented. |
| Database | Implemented | A separate LogiPeople Prisma schema, initial migration and seed exist under `databases/logipeople`. |
| Identity and permissions | Implemented | JWT validation, RBAC, ABAC and field control are implemented as LogiPeople primitives. |
| Organization/Core People | Implemented | Initial models, services, endpoints and web pages are implemented for phases 1-6. |
| Analytics foundation | Implemented | Phase 13 adds aggregated status metrics and governance counts through API endpoints, tests and a web page. Individual BI, predictive analytics and legally validated reporting remain out of scope. |
| Recruitment foundation | Implemented | Phase 11 adds preliminary openings, candidates, applications, API endpoints, tests and a web page. Job-board publishing, offer management and candidate-to-employee conversion remain out of scope. |
| Onboarding foundation | Implemented | Phase 12 adds preliminary internal onboarding plans, checklist tasks, API endpoints, tests and a web page. Admission approval, candidate-to-employee conversion, external provisioning and workflow automation remain out of scope. |
| Time and Attendance foundation | Implemented | Phase 7 adds work schedules, time entries, preliminary attendance periods, API endpoints, tests and a web page. Legal/payroll validation remains pending. |
| Payroll foundation | Implemented | Phase 8 adds preliminary payroll cycles, runs, items, audited reopening requests, API endpoints, tests and a web page. Legal calculation, payments and eSocial remain out of scope. |
| Preliminary payslip foundation | Implemented | Phase 14 adds restricted demonstrative payslips derived from payroll runs, line copies from payroll items, API endpoints, tests and a web page. Employee publication, official PDF/signature, legal calculation, bank payment and eSocial remain out of scope. |
| Benefits foundation | Implemented | Phase 9 adds preliminary benefit plans, enrollments, API endpoints, tests and a web page. Provider integrations, eligibility/legal validation and payroll deductions remain out of scope. |
| Absence and Vacation foundation | Implemented | Phase 10 adds preliminary absence requests, vacation periods, API endpoints, tests and a web page. Legal balance calculations, automatic approvals, payroll effects and eSocial remain out of scope. |
| LogiIdentity foundation | Implemented | Added `apps/identity-api`, `apps/identity-worker`, `databases/identity`, RS256/JWKS, rotating refresh token sessions, Docker services and CI. |
| LogiFlow Identity validation | Partially implemented | LogiFlow accepts Identity tokens through JWKS when `IDENTITY_JWKS_URL` is configured, while local auth remains as compatibility fallback. |
| LogiDesk Identity validation | Partially implemented | LogiDesk exposes `GET /api/v1/auth/me` backed by Identity JWKS. Full frontend SSO remains pending. |
| Platform event contracts | Implemented in shared package | `packages/event-contracts` now defines the strict versioned event envelope and namespaced events for LogiFlow, LogiDesk, LogiPeople and LogiPayroll. Runtime producers/consumers still need migration from legacy names. |
| LogiFlow and LogiDesk dispatch | Partially implemented | `logiflow-worker` dispatches LogiFlow outbox records to LogiDesk. `logidesk-worker` dispatches ticket events with LogiFlow references back to LogiFlow. Polling-based progressive backoff and initial DLQ administrative reprocessing exist on both APIs; Redis Streams and E2E remain pending. |
| LogiDesk operational expansion | Implemented in current scope | Manual tickets, status and priority changes, teams, categories and tags with preliminary UI, assignments, editable internal notes, attachment metadata, initial DLQ administration, internal notifications with preference opt-out, preliminary notification preferences, SLA lifecycle, automatic SLA warning/breach worker, aggregate reporting, dashboard and reports page backed by aggregate data, notifications page with web read action, archive/cancel actions and database migration are implemented and validated. |

## Identity validation evidence

| Command | Result | Notes |
| --- | --- | --- |
| `npm run typecheck -w identity-api` | PASS | Identity API compiles. |
| `npm run typecheck -w identity-worker` | PASS | Identity worker compiles. |
| `npm run test -w identity-api` | PASS | 1 unit test passed. |
| `docker compose up -d` | PASS | Identity, LogiFlow, LogiDesk, Redis, databases, workers and webs became healthy. |
| Identity smoke test | PASS | Login, refresh, logout, JWKS, LogiFlow `/api/v1/auth/me` and LogiDesk `/api/v1/auth/me` passed. |
| `npm run typecheck -w @logipeople/event-contracts` | PASS | Event contract package compiles. |
| `npm run test -w @logipeople/event-contracts` | PASS | 5 contract tests passed. |
| `npm run typecheck -w logiflow-worker` | PASS | LogiFlow worker dispatcher compiles. |
| `npm test -- src/__tests__/logiflow-operations-v1.test.ts` | PASS | Escalation test passed with `logiflow.occurrence.escalated`. |
| `docker compose build logiflow-worker` | PASS | Worker Docker image built. |
| `npm run typecheck -w logidesk-worker` | PASS | LogiDesk worker dispatcher compiles. |
| `npm run build -w logidesk-worker` | PASS | LogiDesk worker build passed. |
| `npm test -- src/__tests__/logiflow-operations-v1.test.ts` | PASS | 11 tests, including service-token callback from LogiDesk to LogiFlow. |
| `docker compose build logidesk-worker` | PASS | LogiDesk worker Docker image built. |
| `npm run logidesk:prisma:generate` | PASS | LogiDesk Prisma Client generated after operational schema. |
| `npx prisma validate --config apps/logidesk-api/prisma.config.ts` | PASS | LogiDesk schema is valid after the notification preference migration. |
| `npm run typecheck -w logidesk-api` | PASS | LogiDesk API compiles. |
| `npm run test -w logidesk-api` | PASS | 16 tests passed, including attachment guardrails, internal notifications, preference opt-out, SLA lifecycle and aggregate reporting. |
| `npm run typecheck -w logidesk-worker` | PASS | LogiDesk worker compiles with automatic SLA evaluation. |
| `npm run build -w logidesk-worker` | PASS | LogiDesk worker build passed with SLA warning/breach handling. |
| `npm run typecheck -w logidesk-web` | PASS | LogiDesk dashboard, reports, catalog settings and notifications compile. |
| `npm run build -w logidesk-web` | PASS | LogiDesk Next build passed with `/reports` and catalog settings; known root/multiple lockfile warning remains. |
| `npm run lint` | PASS | No errors after web notifications. |
| `npm run typecheck` | PASS | Root and workspace typechecks passed after web notifications. |
| `npm run test:workspaces` | PASS | Identity, LogiDesk, LogiPeople and contracts passed; packages without tests used `passWithNoTests`. |
| `npm run build:workspaces` | PASS | Workspace builds passed; known Next root/multiple lockfile warning remains. |
| `npm audit --audit-level=high` | PASS | 0 vulnerabilities. |
| `docker compose --env-file .env.example build logidesk-migrate logidesk-api` | PASS | First attempt without env failed on missing `IDENTITY_DB_PASSWORD`; rerun with `.env.example` built the images. |
| `docker compose --env-file .env.example build logidesk-web` | PASS | Web image built after notification read action; internal `npm ci` reported 0 vulnerabilities. |
| `docker compose --env-file .env.example build logidesk-migrate logidesk-api logidesk-web` | PASS | LogiDesk images affected by the preference migration/API/web changes built successfully. |
| `docker compose --env-file .env.example build logidesk-api` | PASS | LogiDesk API built after applying notification preference opt-out to notification creation. |
| `docker compose --env-file .env.example build logidesk-api` | PASS | LogiDesk API built after attachment guardrails; internal `npm ci` reported 0 vulnerabilities. |
| `docker compose --env-file .env.example build logiflow-worker logidesk-worker` | PASS | Workers built after progressive backoff; internal `npm ci` reported 0 vulnerabilities. |
| `docker compose --env-file .env.example build logidesk-web` | PASS | LogiDesk web built after adding `/reports` and catalog settings; internal `npm ci` reported 0 vulnerabilities. |

## Explicitly not complete

- Payroll legal calculation and homologation are not implemented.
- Payroll payment execution is not implemented.
- Official payslip publication, employee release, PDF generation, signature workflow and legal payslip validation are not implemented.
- Benefits provider integrations and definitive payroll deductions are not implemented.
- Recruitment job-board publishing, offer management, hiring automation and candidate-to-employee conversion are not implemented.
- Onboarding admission approval, candidate-to-employee conversion, external provisioning and workflow automation are not implemented.
- Analytics are aggregate-only; individual-level BI, predictive analytics, automated decisions and legally validated reporting are not implemented.
- Absence and vacation legal balance calculations, automatic approvals and payroll effects are not implemented.
- eSocial real submission is not implemented.
- Legal/tax compliance is not validated.
- Time and attendance is implemented only as a preliminary foundation and is not legally validated.
- Real LogiFlow/LogiDesk integration events are not enabled.
- LogiDesk attachments currently store metadata only; binary upload, object storage, antivirus scanning and retention policies are not implemented.
- LogiDesk notifications are persisted, readable and can be marked as read from the web UI. Preliminary user preference persistence/API/web exists and filters internal user notification creation, but it is not yet connected to authenticated SSO users or real-time Socket.IO delivery.
- LogiDesk SLA records first response, pause, resume, resolution and automatic warning/breach events, but business calendars and holidays are not implemented.

## Known risks

- `pnpm` is not available in the current shell, so validation can use npm workspaces until pnpm is installed.
- LogiPeople web still uses a placeholder LogiIdentity token provider, so authenticated pages render the no-credential state until real identity integration is wired.
- Time and attendance records are preliminary evidence and summaries only; they must not be used for payroll or compliance decisions without legal and DP validation.
- Payroll records are preliminary restricted evidence only; they must not trigger bank payments, payslip publication, eSocial events or legal compliance claims without specialized validation.
- Payslip records are preliminary restricted evidence only; they must not be published to employees, signed, converted into official PDFs, paid, sent to eSocial or treated as legally validated without specialized DP/legal review.
- Benefits records are preliminary restricted evidence only; they must not trigger provider communications, payroll deductions or eligibility/compliance claims without specialized validation.
- Absence and vacation records are preliminary confidential evidence only; they must not trigger automatic approvals, payroll effects, eSocial events or legal compliance claims without DP and legal validation.
- Recruitment records are preliminary confidential evidence only; they must not trigger hiring, onboarding, offer commitments or external publication without HR governance and consent validation.
- Onboarding records are preliminary confidential evidence only; they must not trigger admission approval, access provisioning, benefits activation, payroll setup or external communications without HR/DP governance.
- Analytics are preliminary aggregate indicators only; they must not be used for legal, payroll, hiring, termination, benefit eligibility or disciplinary decisions without validated governance and source review.
