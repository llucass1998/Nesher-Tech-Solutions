CREATE TYPE "AbsenceRequestType" AS ENUM ('SICK_LEAVE', 'PERSONAL_LEAVE', 'UNPAID_LEAVE', 'MATERNITY', 'PATERNITY', 'BEREAVEMENT', 'OTHER');
CREATE TYPE "AbsenceRequestStatus" AS ENUM ('REQUESTED', 'APPROVED', 'REJECTED', 'CANCELLED');
CREATE TYPE "VacationPeriodStatus" AS ENUM ('PLANNED', 'REQUESTED', 'APPROVED', 'TAKEN', 'CANCELLED');

CREATE TABLE "AbsenceRequest" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "type" "AbsenceRequestType" NOT NULL,
    "status" "AbsenceRequestStatus" NOT NULL DEFAULT 'REQUESTED',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "totalDays" INTEGER NOT NULL,
    "notes" TEXT,
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

    CONSTRAINT "AbsenceRequest_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "VacationPeriod" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "accrualStart" TIMESTAMP(3) NOT NULL,
    "accrualEnd" TIMESTAMP(3) NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "days" INTEGER NOT NULL,
    "status" "VacationPeriodStatus" NOT NULL DEFAULT 'PLANNED',
    "notes" TEXT,
    "approvedAt" TIMESTAMP(3),
    "approvedBy" TEXT,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recordedBy" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "legalValidationPending" BOOLEAN NOT NULL DEFAULT true,
    "dataClassification" "DataClassification" NOT NULL DEFAULT 'CONFIDENTIAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VacationPeriod_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AbsenceRequest_companyId_status_idx" ON "AbsenceRequest"("companyId", "status");
CREATE INDEX "AbsenceRequest_employeeId_startDate_endDate_idx" ON "AbsenceRequest"("employeeId", "startDate", "endDate");
CREATE INDEX "VacationPeriod_companyId_status_idx" ON "VacationPeriod"("companyId", "status");
CREATE INDEX "VacationPeriod_employeeId_periodStart_periodEnd_idx" ON "VacationPeriod"("employeeId", "periodStart", "periodEnd");

ALTER TABLE "AbsenceRequest" ADD CONSTRAINT "AbsenceRequest_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AbsenceRequest" ADD CONSTRAINT "AbsenceRequest_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "VacationPeriod" ADD CONSTRAINT "VacationPeriod_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "VacationPeriod" ADD CONSTRAINT "VacationPeriod_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
