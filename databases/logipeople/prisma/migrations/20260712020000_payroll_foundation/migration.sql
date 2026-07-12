CREATE TYPE "PayrollCycleStatus" AS ENUM ('DRAFT', 'OPEN', 'CALCULATED', 'CLOSED', 'REOPENED', 'CANCELLED');
CREATE TYPE "PayrollRunStatus" AS ENUM ('DRAFT', 'CALCULATED', 'REVIEWED', 'CLOSED', 'REOPENED', 'CANCELLED');
CREATE TYPE "PayrollItemType" AS ENUM ('EARNING', 'DEDUCTION', 'EMPLOYER_CHARGE', 'INFORMATIONAL');
CREATE TYPE "PayrollItemSource" AS ENUM ('MANUAL', 'IMPORTED', 'ATTENDANCE', 'BENEFITS', 'CONTRACT', 'ADJUSTMENT');
CREATE TYPE "PayrollReopeningStatus" AS ENUM ('REQUESTED', 'APPROVED', 'REJECTED', 'APPLIED');

CREATE TABLE "PayrollCycle" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "referenceMonth" INTEGER NOT NULL,
  "referenceYear" INTEGER NOT NULL,
  "periodStart" TIMESTAMP(3) NOT NULL,
  "periodEnd" TIMESTAMP(3) NOT NULL,
  "status" "PayrollCycleStatus" NOT NULL DEFAULT 'DRAFT',
  "legalValidationPending" BOOLEAN NOT NULL DEFAULT true,
  "closedAt" TIMESTAMP(3),
  "closedBy" TEXT,
  "reopenedAt" TIMESTAMP(3),
  "reopenedBy" TEXT,
  "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "recordedBy" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "source" TEXT NOT NULL,
  "dataClassification" "DataClassification" NOT NULL DEFAULT 'RESTRICTED',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PayrollCycle_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PayrollRun" (
  "id" TEXT NOT NULL,
  "cycleId" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "employeeId" TEXT NOT NULL,
  "status" "PayrollRunStatus" NOT NULL DEFAULT 'DRAFT',
  "grossAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "deductionAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "netAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "currency" TEXT NOT NULL DEFAULT 'BRL',
  "legalValidationPending" BOOLEAN NOT NULL DEFAULT true,
  "calculatedAt" TIMESTAMP(3),
  "reviewedAt" TIMESTAMP(3),
  "reviewedBy" TEXT,
  "closedAt" TIMESTAMP(3),
  "closedBy" TEXT,
  "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "recordedBy" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "source" TEXT NOT NULL,
  "dataClassification" "DataClassification" NOT NULL DEFAULT 'RESTRICTED',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PayrollRun_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PayrollItem" (
  "id" TEXT NOT NULL,
  "runId" TEXT NOT NULL,
  "employeeId" TEXT NOT NULL,
  "type" "PayrollItemType" NOT NULL,
  "source" "PayrollItemSource" NOT NULL DEFAULT 'MANUAL',
  "code" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "quantity" DECIMAL(14,4),
  "amount" DECIMAL(14,2) NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'BRL',
  "taxable" BOOLEAN NOT NULL DEFAULT false,
  "legalValidationPending" BOOLEAN NOT NULL DEFAULT true,
  "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "recordedBy" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "dataClassification" "DataClassification" NOT NULL DEFAULT 'RESTRICTED',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PayrollItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PayrollReopening" (
  "id" TEXT NOT NULL,
  "cycleId" TEXT NOT NULL,
  "status" "PayrollReopeningStatus" NOT NULL DEFAULT 'REQUESTED',
  "requestedBy" TEXT NOT NULL,
  "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "approvedBy" TEXT,
  "approvedAt" TIMESTAMP(3),
  "appliedBy" TEXT,
  "appliedAt" TIMESTAMP(3),
  "reason" TEXT NOT NULL,
  "dataClassification" "DataClassification" NOT NULL DEFAULT 'RESTRICTED',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PayrollReopening_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PayrollCycle_companyId_referenceMonth_referenceYear_key" ON "PayrollCycle"("companyId", "referenceMonth", "referenceYear");
CREATE INDEX "PayrollCycle_companyId_status_idx" ON "PayrollCycle"("companyId", "status");
CREATE UNIQUE INDEX "PayrollRun_cycleId_employeeId_key" ON "PayrollRun"("cycleId", "employeeId");
CREATE INDEX "PayrollRun_companyId_status_idx" ON "PayrollRun"("companyId", "status");
CREATE INDEX "PayrollRun_employeeId_status_idx" ON "PayrollRun"("employeeId", "status");
CREATE INDEX "PayrollItem_runId_type_idx" ON "PayrollItem"("runId", "type");
CREATE INDEX "PayrollItem_employeeId_code_idx" ON "PayrollItem"("employeeId", "code");
CREATE INDEX "PayrollReopening_cycleId_status_idx" ON "PayrollReopening"("cycleId", "status");

ALTER TABLE "PayrollCycle" ADD CONSTRAINT "PayrollCycle_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PayrollRun" ADD CONSTRAINT "PayrollRun_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "PayrollCycle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PayrollRun" ADD CONSTRAINT "PayrollRun_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PayrollRun" ADD CONSTRAINT "PayrollRun_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PayrollItem" ADD CONSTRAINT "PayrollItem_runId_fkey" FOREIGN KEY ("runId") REFERENCES "PayrollRun"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PayrollItem" ADD CONSTRAINT "PayrollItem_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PayrollReopening" ADD CONSTRAINT "PayrollReopening_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "PayrollCycle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
