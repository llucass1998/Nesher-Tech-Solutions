CREATE TABLE "Notification" (
  "id" TEXT NOT NULL,
  "ticketId" TEXT,
  "userId" TEXT,
  "teamId" TEXT,
  "type" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "readAt" TIMESTAMP(3),
  "correlationId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Notification_userId_readAt_createdAt_idx" ON "Notification"("userId", "readAt", "createdAt");
CREATE INDEX "Notification_teamId_readAt_createdAt_idx" ON "Notification"("teamId", "readAt", "createdAt");
CREATE INDEX "Notification_ticketId_createdAt_idx" ON "Notification"("ticketId", "createdAt");

ALTER TABLE "Notification" ADD CONSTRAINT "Notification_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;
