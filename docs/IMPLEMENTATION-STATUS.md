# Implementation status

## Scope for this execution

Phases 1-10 are in scope:

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
| Payroll foundation | Implemented | Phase 8 adds preliminary payroll cycles, runs, items, audited reopening requests, API endpoints, tests and a web page. Legal calculation, payments and eSocial remain out of scope. |
| Benefits foundation | Implemented | Phase 9 adds preliminary benefit plans, enrollments, API endpoints, tests and a web page. Provider integrations, eligibility/legal validation and payroll deductions remain out of scope. |
| Absence and Vacation foundation | Implemented | Phase 10 adds preliminary absence requests, vacation periods, API endpoints, tests and a web page. Legal balance calculations, automatic approvals, payroll effects and eSocial remain out of scope. |

## Explicitly not complete

- Payroll legal calculation and homologation are not implemented.
- Payroll payment execution is not implemented.
- Benefits provider integrations and definitive payroll deductions are not implemented.
- Absence and vacation legal balance calculations, automatic approvals and payroll effects are not implemented.
- eSocial real submission is not implemented.
- Legal/tax compliance is not validated.
- Time and attendance is implemented only as a preliminary foundation and is not legally validated.
- Real LogiFlow/LogiDesk integration events are not enabled.

## Known risks

- `pnpm` is not available in the current shell, so validation can use npm workspaces until pnpm is installed.
- LogiPeople web still uses a placeholder LogiIdentity token provider, so authenticated pages render the no-credential state until real identity integration is wired.
- Time and attendance records are preliminary evidence and summaries only; they must not be used for payroll or compliance decisions without legal and DP validation.
- Payroll records are preliminary restricted evidence only; they must not trigger bank payments, payslip publication, eSocial events or legal compliance claims without specialized validation.
- Benefits records are preliminary restricted evidence only; they must not trigger provider communications, payroll deductions or eligibility/compliance claims without specialized validation.
- Absence and vacation records are preliminary confidential evidence only; they must not trigger automatic approvals, payroll effects, eSocial events or legal compliance claims without DP and legal validation.
