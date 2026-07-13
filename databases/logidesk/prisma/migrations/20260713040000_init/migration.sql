CREATE TYPE "TicketStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'WAITING_CUSTOMER', 'RESOLVED', 'CLOSED', 'REOPENED');
CREATE TYPE "TicketPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');
CREATE TYPE "TicketSource" AS ENUM ('LOGIFLOW', 'LOGIDESK', 'EMAIL', 'API');
CREATE TYPE "SlaStatus" AS ENUM ('RUNNING', 'PAUSED', 'WARNING', 'BREACHED', 'MET');
CREATE TYPE "OutboxStatus" AS ENUM ('PENDING', 'PROCESSING', 'PROCESSED', 'FAILED', 'DEAD_LETTER');

CREATE TABLE "Ticket" (
  "id" TEXT NOT NULL,
  "number" TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "status" "TicketStatus" NOT NULL DEFAULT 'OPEN',
  "priority" "TicketPriority" NOT NULL DEFAULT 'MEDIUM',
  "source" "TicketSource" NOT NULL DEFAULT 'LOGIDESK',
  "requesterId" TEXT,
  "requesterEmail" TEXT,
  "assigneeId" TEXT,
  "teamId" TEXT,
  "category" TEXT,
  "externalSystem" TEXT,
  "externalId" TEXT,
  "deliveryId" TEXT,
  "occurrenceId" TEXT,
  "correlationId" TEXT NOT NULL,
  "idempotencyKey" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Ticket_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TicketMessage" (
  "id" TEXT NOT NULL,
  "ticketId" TEXT NOT NULL,
  "authorId" TEXT,
  "authorRole" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "internal" BOOLEAN NOT NULL DEFAULT false,
  "correlationId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TicketMessage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TicketNote" (
  "id" TEXT NOT NULL,
  "ticketId" TEXT NOT NULL,
  "authorId" TEXT,
  "body" TEXT NOT NULL,
  "correlationId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TicketNote_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TicketHistory" (
  "id" TEXT NOT NULL,
  "ticketId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "before" JSONB,
  "after" JSONB,
  "actorId" TEXT,
  "actorRole" TEXT,
  "correlationId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TicketHistory_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SlaPolicy" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "priority" "TicketPriority" NOT NULL,
  "firstResponseMinutes" INTEGER NOT NULL,
  "resolutionMinutes" INTEGER NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SlaPolicy_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TicketSla" (
  "id" TEXT NOT NULL,
  "ticketId" TEXT NOT NULL,
  "status" "SlaStatus" NOT NULL DEFAULT 'RUNNING',
  "firstResponseDueAt" TIMESTAMP(3) NOT NULL,
  "resolutionDueAt" TIMESTAMP(3) NOT NULL,
  "firstRespondedAt" TIMESTAMP(3),
  "resolvedAt" TIMESTAMP(3),
  "pausedAt" TIMESTAMP(3),
  "pausedDurationSeconds" INTEGER NOT NULL DEFAULT 0,
  "warningEmittedAt" TIMESTAMP(3),
  "breachedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TicketSla_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "IdempotencyRecord" (
  "id" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "operation" TEXT NOT NULL,
  "requestHash" TEXT NOT NULL,
  "responseRef" TEXT,
  "correlationId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "IdempotencyRecord_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OutboxEvent" (
  "id" TEXT NOT NULL,
  "eventType" TEXT NOT NULL,
  "eventVersion" INTEGER NOT NULL,
  "payload" JSONB NOT NULL,
  "status" "OutboxStatus" NOT NULL DEFAULT 'PENDING',
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "lastError" TEXT,
  "correlationId" TEXT NOT NULL,
  "causationId" TEXT,
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

CREATE TABLE "AuditLog" (
  "id" TEXT NOT NULL,
  "actorId" TEXT,
  "actorRole" TEXT,
  "action" TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT NOT NULL,
  "before" JSONB,
  "after" JSONB,
  "requestId" TEXT,
  "correlationId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Ticket_number_key" ON "Ticket"("number");
CREATE UNIQUE INDEX "Ticket_externalSystem_externalId_key" ON "Ticket"("externalSystem", "externalId");
CREATE INDEX "Ticket_status_priority_idx" ON "Ticket"("status", "priority");
CREATE INDEX "Ticket_correlationId_idx" ON "Ticket"("correlationId");
CREATE INDEX "TicketMessage_ticketId_createdAt_idx" ON "TicketMessage"("ticketId", "createdAt");
CREATE INDEX "TicketNote_ticketId_createdAt_idx" ON "TicketNote"("ticketId", "createdAt");
CREATE INDEX "TicketHistory_ticketId_createdAt_idx" ON "TicketHistory"("ticketId", "createdAt");
CREATE UNIQUE INDEX "TicketSla_ticketId_key" ON "TicketSla"("ticketId");
CREATE UNIQUE INDEX "IdempotencyRecord_key_key" ON "IdempotencyRecord"("key");
CREATE INDEX "OutboxEvent_status_createdAt_idx" ON "OutboxEvent"("status", "createdAt");
CREATE INDEX "OutboxEvent_correlationId_idx" ON "OutboxEvent"("correlationId");
CREATE INDEX "DeadLetterEvent_correlationId_idx" ON "DeadLetterEvent"("correlationId");
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");
CREATE INDEX "AuditLog_correlationId_idx" ON "AuditLog"("correlationId");

ALTER TABLE "TicketMessage" ADD CONSTRAINT "TicketMessage_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TicketNote" ADD CONSTRAINT "TicketNote_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TicketHistory" ADD CONSTRAINT "TicketHistory_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TicketSla" ADD CONSTRAINT "TicketSla_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;
