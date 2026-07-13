CREATE TABLE "OutboxEvent" (
  "id" TEXT NOT NULL,
  "eventType" TEXT NOT NULL,
  "eventVersion" INTEGER NOT NULL,
  "payload" JSONB NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "lastError" TEXT,
  "correlationId" TEXT NOT NULL,
  "causationId" TEXT,
  "idempotencyKey" TEXT NOT NULL,
  "processedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "OutboxEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DeadLetterEvent" (
  "id" TEXT NOT NULL,
  "outboxEventId" TEXT,
  "eventType" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "error" TEXT NOT NULL,
  "correlationId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DeadLetterEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "OutboxEvent_idempotencyKey_key" ON "OutboxEvent"("idempotencyKey");
CREATE INDEX "OutboxEvent_status_createdAt_idx" ON "OutboxEvent"("status", "createdAt");
CREATE INDEX "OutboxEvent_correlationId_idx" ON "OutboxEvent"("correlationId");
CREATE INDEX "DeadLetterEvent_correlationId_idx" ON "DeadLetterEvent"("correlationId");
