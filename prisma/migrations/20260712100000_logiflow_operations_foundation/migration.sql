-- Fase 7 - LogiFlow operacional: historico, ocorrencias e comprovantes

CREATE TABLE "DeliveryStatusHistory" (
  "id" TEXT NOT NULL,
  "deliveryId" TEXT NOT NULL,
  "previousStatus" TEXT NOT NULL,
  "newStatus" TEXT NOT NULL,
  "changedByUserId" TEXT,
  "reason" TEXT,
  "requestId" TEXT,
  "correlationId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "DeliveryStatusHistory_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Occurrence" (
  "id" TEXT NOT NULL,
  "deliveryId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "severity" TEXT NOT NULL DEFAULT 'MEDIUM',
  "status" TEXT NOT NULL DEFAULT 'OPEN',
  "integrationStatus" TEXT NOT NULL DEFAULT 'NOT_REQUESTED',
  "retryCount" INTEGER NOT NULL DEFAULT 0,
  "lastError" TEXT,
  "ticketNumber" TEXT,
  "createdByUserId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Occurrence_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DeliveryProof" (
  "id" TEXT NOT NULL,
  "deliveryId" TEXT NOT NULL,
  "type" TEXT NOT NULL DEFAULT 'PHOTO',
  "url" TEXT NOT NULL,
  "description" TEXT,
  "uploadedByUserId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "DeliveryProof_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "DeliveryStatusHistory_deliveryId_createdAt_idx" ON "DeliveryStatusHistory"("deliveryId", "createdAt");
CREATE INDEX "Occurrence_deliveryId_createdAt_idx" ON "Occurrence"("deliveryId", "createdAt");
CREATE INDEX "Occurrence_integrationStatus_idx" ON "Occurrence"("integrationStatus");
CREATE INDEX "DeliveryProof_deliveryId_createdAt_idx" ON "DeliveryProof"("deliveryId", "createdAt");

ALTER TABLE "DeliveryStatusHistory"
  ADD CONSTRAINT "DeliveryStatusHistory_deliveryId_fkey"
  FOREIGN KEY ("deliveryId") REFERENCES "Delivery"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Occurrence"
  ADD CONSTRAINT "Occurrence_deliveryId_fkey"
  FOREIGN KEY ("deliveryId") REFERENCES "Delivery"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "DeliveryProof"
  ADD CONSTRAINT "DeliveryProof_deliveryId_fkey"
  FOREIGN KEY ("deliveryId") REFERENCES "Delivery"("id") ON DELETE CASCADE ON UPDATE CASCADE;
