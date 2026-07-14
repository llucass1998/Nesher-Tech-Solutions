CREATE TYPE "PayrollRunStatus" AS ENUM ('DRAFT', 'CALCULATING', 'REVIEW', 'APPROVED', 'CLOSED', 'CANCELED');

CREATE TABLE "PayrollEmployeeReference" (
  "id" TEXT NOT NULL,
  "identityUserId" TEXT,
  "logiPeopleId" TEXT,
  "fullName" TEXT NOT NULL,
  "documentHash" TEXT,
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PayrollEmployeeReference_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Contract" (
  "id" TEXT NOT NULL,
  "employeeId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "startsAt" TIMESTAMP(3) NOT NULL,
  "endsAt" TIMESTAMP(3),
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Contract_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PayrollRun" (
  "id" TEXT NOT NULL,
  "referenceMonth" INTEGER NOT NULL,
  "referenceYear" INTEGER NOT NULL,
  "status" "PayrollRunStatus" NOT NULL DEFAULT 'DRAFT',
  "idempotencyKey" TEXT,
  "correlationId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PayrollRun_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PayrollItem" (
  "id" TEXT NOT NULL,
  "payrollRunId" TEXT NOT NULL,
  "employeeId" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "kind" TEXT NOT NULL,
  "amountCents" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PayrollItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OutboxEvent" (
  "id" TEXT NOT NULL,
  "eventType" TEXT NOT NULL,
  "eventVersion" INTEGER NOT NULL DEFAULT 1,
  "payload" JSONB NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "correlationId" TEXT,
  "causationId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "processedAt" TIMESTAMP(3),
  "lastError" TEXT,
  CONSTRAINT "OutboxEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "InboxMessage" (
  "id" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "eventType" TEXT NOT NULL,
  "producer" TEXT NOT NULL,
  "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "InboxMessage_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PayrollEmployeeReference_logiPeopleId_key" ON "PayrollEmployeeReference"("logiPeopleId");
CREATE UNIQUE INDEX "PayrollRun_idempotencyKey_key" ON "PayrollRun"("idempotencyKey");
CREATE UNIQUE INDEX "PayrollRun_referenceMonth_referenceYear_key" ON "PayrollRun"("referenceMonth", "referenceYear");
CREATE INDEX "PayrollItem_employeeId_idx" ON "PayrollItem"("employeeId");
CREATE UNIQUE INDEX "InboxMessage_eventId_key" ON "InboxMessage"("eventId");

ALTER TABLE "Contract" ADD CONSTRAINT "Contract_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "PayrollEmployeeReference"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PayrollItem" ADD CONSTRAINT "PayrollItem_payrollRunId_fkey" FOREIGN KEY ("payrollRunId") REFERENCES "PayrollRun"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
