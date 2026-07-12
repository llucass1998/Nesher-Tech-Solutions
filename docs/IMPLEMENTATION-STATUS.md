# Implementation status

## Scope for this execution

Only phases 1-6 are in scope:

1. Study and diagnosis.
2. Reference and license documentation.
3. LogiPeople structure.
4. Database and migrations.
5. LogiIdentity integration boundary.
6. Organization and Core People.

## Current status

| Area | Status | Notes |
| --- | --- | --- |
| LogiFlow preservation | In progress | Existing Express and Next.js structure remains in place. |
| LogiPeople workspace | Implemented | Apps and packages were added under `apps/` and `packages/`. |
| Documentation | Implemented | Architecture, domains, references and legal caveats are documented. |
| Database | Implemented | A separate LogiPeople Prisma schema, initial migration and seed exist under `databases/logipeople`. |
| Identity and permissions | Implemented | JWT validation, RBAC, ABAC and field control are implemented as LogiPeople primitives. |
| Organization/Core People | Implemented | Initial models, services, endpoints and web pages are implemented for phases 1-6. |

## Explicitly not complete

- Payroll is not implemented.
- Time and attendance is not implemented.
- Benefits are not implemented.
- eSocial real submission is not implemented.
- Legal/tax compliance is not validated.
- Real LogiFlow/LogiDesk integration events are not enabled.

## Known risks

- `pnpm` is not available in the current shell, so validation can use npm workspaces until pnpm is installed.
- The repository is currently in detached `HEAD`, which prevents agent worktree creation and should be resolved before semantic commits.
- Existing LogiFlow payment API-key tests appear inconsistent with current route implementation.
