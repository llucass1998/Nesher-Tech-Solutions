-- Payslip foundation: preliminary restricted demonstrative payroll records.
-- These records are not legally validated payslips.

CREATE TYPE "PayslipStatus" AS ENUM ('DRAFT', 'READY_FOR_REVIEW', 'CANCELLED');
CREATE TYPE "PayslipLineType" AS ENUM ('EARNING', 'DEDUCTION', 'EMPLOYER_CHARGE', 'INFORMATIONAL');

CREATE TABLE "Payslip" (
  "id" TEXT NOT NULL,
  "payrollRunId" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "employeeId" TEXT NOT NULL,
  "status" "PayslipStatus" NOT NULL DEFAULT 'DRAFT',
  "referenceMonth" INTEGER NOT NULL,
  "referenceYear" INTEGER NOT NULL,
  "grossAmount" DECIMAL(14, 2) NOT NULL DEFAULT 0,
  "deductionAmount" DECIMAL(14, 2) NOT NULL DEFAULT 0,
  "netAmount" DECIMAL(14, 2) NOT NULL DEFAULT 0,
  "currency" TEXT NOT NULL DEFAULT 'BRL',
  "visibleToEmployee" BOOLEAN NOT NULL DEFAULT false,
  "publishedAt" TIMESTAMP(3),
  "cancelledAt" TIMESTAMP(3),
  "cancelledBy" TEXT,
  "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "recordedBy" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "source" TEXT NOT NULL,
  "legalValidationPending" BOOLEAN NOT NULL DEFAULT true,
  "dataClassification" "DataClassification" NOT NULL DEFAULT 'RESTRICTED',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Payslip_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PayslipLine" (
  "id" TEXT NOT NULL,
  "payslipId" TEXT NOT NULL,
  "payrollItemId" TEXT,
  "employeeId" TEXT NOT NULL,
  "type" "PayslipLineType" NOT NULL,
  "code" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "quantity" DECIMAL(14, 4),
  "amount" DECIMAL(14, 2) NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'BRL',
  "legalValidationPending" BOOLEAN NOT NULL DEFAULT true,
  "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "recordedBy" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "dataClassification" "DataClassification" NOT NULL DEFAULT 'RESTRICTED',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "PayslipLine_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Payslip_payrollRunId_key" ON "Payslip"("payrollRunId");
CREATE INDEX "Payslip_companyId_status_idx" ON "Payslip"("companyId", "status");
CREATE INDEX "Payslip_employeeId_referenceYear_referenceMonth_idx" ON "Payslip"("employeeId", "referenceYear", "referenceMonth");
CREATE INDEX "PayslipLine_payslipId_type_idx" ON "PayslipLine"("payslipId", "type");
CREATE INDEX "PayslipLine_employeeId_code_idx" ON "PayslipLine"("employeeId", "code");

ALTER TABLE "Payslip"
  ADD CONSTRAINT "Payslip_payrollRunId_fkey"
  FOREIGN KEY ("payrollRunId") REFERENCES "PayrollRun"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Payslip"
  ADD CONSTRAINT "Payslip_companyId_fkey"
  FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Payslip"
  ADD CONSTRAINT "Payslip_employeeId_fkey"
  FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "PayslipLine"
  ADD CONSTRAINT "PayslipLine_payslipId_fkey"
  FOREIGN KEY ("payslipId") REFERENCES "Payslip"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "PayslipLine"
  ADD CONSTRAINT "PayslipLine_payrollItemId_fkey"
  FOREIGN KEY ("payrollItemId") REFERENCES "PayrollItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "PayslipLine"
  ADD CONSTRAINT "PayslipLine_employeeId_fkey"
  FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
