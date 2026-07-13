CREATE TYPE "BenefitPlanType" AS ENUM ('HEALTH', 'DENTAL', 'MEAL', 'FOOD', 'TRANSPORT', 'LIFE_INSURANCE', 'WELLNESS', 'OTHER');
CREATE TYPE "BenefitPlanStatus" AS ENUM ('DRAFT', 'ACTIVE', 'INACTIVE');
CREATE TYPE "BenefitEnrollmentStatus" AS ENUM ('REQUESTED', 'ACTIVE', 'SUSPENDED', 'CANCELLED');

CREATE TABLE "BenefitPlan" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "providerName" TEXT NOT NULL,
    "type" "BenefitPlanType" NOT NULL,
    "status" "BenefitPlanStatus" NOT NULL DEFAULT 'DRAFT',
    "employerCostAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "employeeCostAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'BRL',
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "effectiveTo" TIMESTAMP(3),
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recordedBy" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "legalValidationPending" BOOLEAN NOT NULL DEFAULT true,
    "dataClassification" "DataClassification" NOT NULL DEFAULT 'RESTRICTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BenefitPlan_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BenefitEnrollment" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "status" "BenefitEnrollmentStatus" NOT NULL DEFAULT 'REQUESTED',
    "coverageLevel" TEXT NOT NULL,
    "employeeCostAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "employerCostAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'BRL',
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "effectiveTo" TIMESTAMP(3),
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recordedBy" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "legalValidationPending" BOOLEAN NOT NULL DEFAULT true,
    "dataClassification" "DataClassification" NOT NULL DEFAULT 'RESTRICTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BenefitEnrollment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "BenefitPlan_companyId_status_idx" ON "BenefitPlan"("companyId", "status");
CREATE INDEX "BenefitPlan_type_status_idx" ON "BenefitPlan"("type", "status");
CREATE INDEX "BenefitEnrollment_employeeId_status_idx" ON "BenefitEnrollment"("employeeId", "status");
CREATE INDEX "BenefitEnrollment_planId_status_idx" ON "BenefitEnrollment"("planId", "status");
CREATE INDEX "BenefitEnrollment_effectiveFrom_effectiveTo_idx" ON "BenefitEnrollment"("effectiveFrom", "effectiveTo");

ALTER TABLE "BenefitPlan" ADD CONSTRAINT "BenefitPlan_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BenefitEnrollment" ADD CONSTRAINT "BenefitEnrollment_planId_fkey" FOREIGN KEY ("planId") REFERENCES "BenefitPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BenefitEnrollment" ADD CONSTRAINT "BenefitEnrollment_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
