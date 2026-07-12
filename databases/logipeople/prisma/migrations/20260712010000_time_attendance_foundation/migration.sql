CREATE TYPE "WorkScheduleStatus" AS ENUM ('ACTIVE', 'INACTIVE');
CREATE TYPE "TimeEntryKind" AS ENUM ('CLOCK_IN', 'CLOCK_OUT', 'BREAK_START', 'BREAK_END', 'ADJUSTMENT');
CREATE TYPE "TimeEntrySource" AS ENUM ('MANUAL', 'IMPORTED', 'MOBILE', 'WEB', 'API');
CREATE TYPE "TimeEntryApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE "AttendancePeriodStatus" AS ENUM ('OPEN', 'REVIEWED', 'LOCKED');

CREATE TABLE "WorkSchedule" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "employeeId" TEXT,
  "name" TEXT NOT NULL,
  "weeklyMinutes" INTEGER NOT NULL,
  "workDays" INTEGER NOT NULL,
  "status" "WorkScheduleStatus" NOT NULL DEFAULT 'ACTIVE',
  "effectiveFrom" TIMESTAMP(3) NOT NULL,
  "effectiveTo" TIMESTAMP(3),
  "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "recordedBy" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "source" TEXT NOT NULL,
  "dataClassification" "DataClassification" NOT NULL DEFAULT 'CONFIDENTIAL',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "WorkSchedule_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TimeEntry" (
  "id" TEXT NOT NULL,
  "employeeId" TEXT NOT NULL,
  "kind" "TimeEntryKind" NOT NULL,
  "occurredAt" TIMESTAMP(3) NOT NULL,
  "source" "TimeEntrySource" NOT NULL DEFAULT 'MANUAL',
  "approvalStatus" "TimeEntryApprovalStatus" NOT NULL DEFAULT 'PENDING',
  "approvedAt" TIMESTAMP(3),
  "approvedBy" TEXT,
  "rejectedAt" TIMESTAMP(3),
  "rejectedBy" TEXT,
  "rejectionReason" TEXT,
  "notes" TEXT,
  "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "recordedBy" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "dataClassification" "DataClassification" NOT NULL DEFAULT 'CONFIDENTIAL',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TimeEntry_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AttendancePeriod" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "employeeId" TEXT NOT NULL,
  "periodStart" TIMESTAMP(3) NOT NULL,
  "periodEnd" TIMESTAMP(3) NOT NULL,
  "status" "AttendancePeriodStatus" NOT NULL DEFAULT 'OPEN',
  "plannedMinutes" INTEGER NOT NULL DEFAULT 0,
  "workedMinutes" INTEGER NOT NULL DEFAULT 0,
  "absenceMinutes" INTEGER NOT NULL DEFAULT 0,
  "extraMinutes" INTEGER NOT NULL DEFAULT 0,
  "lockedAt" TIMESTAMP(3),
  "lockedBy" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "reviewedBy" TEXT,
  "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "recordedBy" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "source" TEXT NOT NULL,
  "legalValidationPending" BOOLEAN NOT NULL DEFAULT true,
  "dataClassification" "DataClassification" NOT NULL DEFAULT 'CONFIDENTIAL',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AttendancePeriod_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "WorkSchedule_companyId_status_idx" ON "WorkSchedule"("companyId", "status");
CREATE INDEX "WorkSchedule_employeeId_effectiveFrom_idx" ON "WorkSchedule"("employeeId", "effectiveFrom");
CREATE INDEX "TimeEntry_employeeId_occurredAt_idx" ON "TimeEntry"("employeeId", "occurredAt");
CREATE INDEX "TimeEntry_approvalStatus_occurredAt_idx" ON "TimeEntry"("approvalStatus", "occurredAt");
CREATE UNIQUE INDEX "AttendancePeriod_employeeId_periodStart_periodEnd_key" ON "AttendancePeriod"("employeeId", "periodStart", "periodEnd");
CREATE INDEX "AttendancePeriod_companyId_periodStart_periodEnd_idx" ON "AttendancePeriod"("companyId", "periodStart", "periodEnd");
CREATE INDEX "AttendancePeriod_status_periodEnd_idx" ON "AttendancePeriod"("status", "periodEnd");

ALTER TABLE "WorkSchedule" ADD CONSTRAINT "WorkSchedule_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "WorkSchedule" ADD CONSTRAINT "WorkSchedule_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TimeEntry" ADD CONSTRAINT "TimeEntry_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AttendancePeriod" ADD CONSTRAINT "AttendancePeriod_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AttendancePeriod" ADD CONSTRAINT "AttendancePeriod_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
