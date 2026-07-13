-- Defensive compatibility migration for databases that applied earlier phases
-- before Driver.status and Vehicle.status were represented in migrations.

ALTER TABLE "Driver" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'AVAILABLE';
ALTER TABLE "Vehicle" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'AVAILABLE';
