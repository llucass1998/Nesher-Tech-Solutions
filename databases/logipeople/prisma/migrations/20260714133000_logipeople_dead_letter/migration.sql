CREATE TABLE "DeadLetterEvent" (
    "id" TEXT NOT NULL,
    "outboxEventId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "error" TEXT NOT NULL,
    "correlationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeadLetterEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DeadLetterEvent_outboxEventId_key" ON "DeadLetterEvent"("outboxEventId");

ALTER TABLE "DeadLetterEvent" ADD CONSTRAINT "DeadLetterEvent_outboxEventId_fkey"
FOREIGN KEY ("outboxEventId") REFERENCES "OutboxEvent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
