# Implementation status

## Scope for this execution

Phases 1-7 are in scope:

1. Study and diagnosis.
2. Reference and license documentation.
3. LogiPeople structure.
4. Database and migrations.
5. LogiIdentity integration boundary.
6. Organization and Core People.
7. Time and Attendance foundation.

## Current status

| Area | Status | Notes |
| --- | --- | --- |
| LogiFlow preservation | In progress | Existing Express and Next.js structure remains in place. |
| LogiPeople workspace | Implemented | Apps and packages were added under `apps/` and `packages/`. |
| Documentation | Implemented | Architecture, domains, references and legal caveats are documented. |
| Database | Implemented | A separate LogiPeople Prisma schema, initial migration and seed exist under `databases/logipeople`. |
| Identity and permissions | Implemented | JWT validation, RBAC, ABAC and field control are implemented as LogiPeople primitives. |
| Organization/Core People | Implemented | Initial models, services, endpoints and web pages are implemented for phases 1-6. |
| Time and Attendance foundation | Implemented | Phase 7 adds work schedules, time entries, preliminary attendance periods, API endpoints, tests and a web page. Legal/payroll validation remains pending. |

## Explicitly not complete

- Payroll is not implemented.
- Benefits are not implemented.
- eSocial real submission is not implemented.
- Legal/tax compliance is not validated.
- Time and attendance is implemented only as a preliminary foundation and is not legally validated.
- Real LogiFlow/LogiDesk integration events are not enabled.

## Known risks

- `pnpm` is not available in the current shell, so validation can use npm workspaces until pnpm is installed.
- LogiPeople web still uses a placeholder LogiIdentity token provider, so authenticated pages render the no-credential state until real identity integration is wired.
- Time and attendance records are preliminary evidence and summaries only; they must not be used for payroll or compliance decisions without legal and DP validation.
