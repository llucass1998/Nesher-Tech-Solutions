# Architecture

## Current LogiFlow baseline

LogiFlow is currently a single repository with a Next.js App Router frontend in `app/` and a separate Express API in `src/`.

- `package.json` defines a single private app named `logiflow` with `dev`, `dev:api`, `build`, `lint`, `test` and Prisma scripts.
- `app/` contains client-side pages that call the API through `NEXT_PUBLIC_API_URL`, defaulting to `http://localhost:3333`.
- `src/server.ts` starts the Express API on port `3333` and mounts `src/routes.ts`.
- `src/routes.ts` centralizes REST routes for login, users, drivers, vehicles and deliveries.
- `src/controllers/*` currently combine HTTP handling, validation, Prisma access and business rules.
- `prisma/schema.prisma` is the LogiFlow database schema for `Driver`, `Vehicle` and `Delivery`.
- `src/__tests__/payment-api-key.test.ts` expects payment API-key behavior that is not visible in the current route/controller implementation. This is a LogiFlow risk and not part of LogiPeople.

## LogiPeople target for phases 1-6

LogiPeople starts as an independent modular monolith inside the platform workspace, not as another LogiFlow page or Express controller.

```text
apps/logipeople-web      Next.js App Router frontend
apps/logipeople-api      NestJS API under /api/v1
apps/logipeople-worker   Worker bootstrap prepared for future queues
packages/*               Shared contracts, auth, config, logger and tooling
databases/logipeople     Independent Prisma schema and migrations
```

## Boundary decisions

- LogiPeople uses its own PostgreSQL database named `logipeople_db`.
- LogiPeople does not read or write the existing LogiFlow Prisma schema.
- LogiFlow must not query `logipeople_db` directly.
- Controllers in LogiPeople remain thin; business rules live in services/use cases.
- RH and DP are represented as separate domains in the data model and API boundaries, while sharing one API and database initially.
- Payroll, time attendance, benefits, eSocial, AI assistants and real LogiFlow/LogiDesk integrations are intentionally out of scope for this first execution.

## Initial runtime ports

- LogiFlow web: existing Next.js development port.
- LogiFlow API: existing Express port `3333`.
- LogiPeople web: planned development port `3400`.
- LogiPeople API: planned development port `3433`.
