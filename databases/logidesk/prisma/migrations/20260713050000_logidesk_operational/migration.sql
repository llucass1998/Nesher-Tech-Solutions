ALTER TYPE "TicketStatus" ADD VALUE IF NOT EXISTS 'WAITING_INTERNAL';
ALTER TYPE "TicketStatus" ADD VALUE IF NOT EXISTS 'CANCELED';

CREATE TABLE "SupportTeam" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SupportTeam_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SupportTeamMember" (
  "id" TEXT NOT NULL,
  "teamId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "role" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SupportTeamMember_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TicketCategory" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TicketCategory_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TicketTag" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "color" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TicketTag_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TicketTagAssignment" (
  "id" TEXT NOT NULL,
  "ticketId" TEXT NOT NULL,
  "tagId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TicketTagAssignment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TicketAssignment" (
  "id" TEXT NOT NULL,
  "ticketId" TEXT NOT NULL,
  "assigneeId" TEXT,
  "assignedById" TEXT,
  "teamId" TEXT,
  "reason" TEXT,
  "correlationId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TicketAssignment_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Ticket" ADD COLUMN IF NOT EXISTS "requesterName" TEXT;
ALTER TABLE "Ticket" ADD COLUMN IF NOT EXISTS "categoryId" TEXT;
ALTER TABLE "Ticket" ADD COLUMN IF NOT EXISTS "canceledAt" TIMESTAMP(3);
ALTER TABLE "Ticket" ADD COLUMN IF NOT EXISTS "archivedAt" TIMESTAMP(3);

ALTER TABLE "TicketNote" ADD COLUMN IF NOT EXISTS "editedAt" TIMESTAMP(3);
ALTER TABLE "TicketNote" ADD COLUMN IF NOT EXISTS "editedById" TEXT;

ALTER TABLE "TicketHistory" ADD COLUMN IF NOT EXISTS "previousStatus" "TicketStatus";
ALTER TABLE "TicketHistory" ADD COLUMN IF NOT EXISTS "newStatus" "TicketStatus";
ALTER TABLE "TicketHistory" ADD COLUMN IF NOT EXISTS "changedById" TEXT;
ALTER TABLE "TicketHistory" ADD COLUMN IF NOT EXISTS "reason" TEXT;
ALTER TABLE "TicketHistory" ADD COLUMN IF NOT EXISTS "requestId" TEXT;

CREATE UNIQUE INDEX "SupportTeam_name_key" ON "SupportTeam"("name");
CREATE UNIQUE INDEX "SupportTeamMember_teamId_userId_key" ON "SupportTeamMember"("teamId", "userId");
CREATE INDEX "SupportTeamMember_userId_idx" ON "SupportTeamMember"("userId");
CREATE UNIQUE INDEX "TicketCategory_name_key" ON "TicketCategory"("name");
CREATE UNIQUE INDEX "TicketTag_name_key" ON "TicketTag"("name");
CREATE UNIQUE INDEX "TicketTagAssignment_ticketId_tagId_key" ON "TicketTagAssignment"("ticketId", "tagId");
CREATE INDEX "TicketTagAssignment_tagId_idx" ON "TicketTagAssignment"("tagId");
CREATE INDEX "TicketAssignment_ticketId_createdAt_idx" ON "TicketAssignment"("ticketId", "createdAt");
CREATE INDEX "TicketAssignment_assigneeId_idx" ON "TicketAssignment"("assigneeId");
CREATE INDEX "TicketAssignment_teamId_idx" ON "TicketAssignment"("teamId");
CREATE INDEX "Ticket_teamId_idx" ON "Ticket"("teamId");
CREATE INDEX "Ticket_categoryId_idx" ON "Ticket"("categoryId");
CREATE INDEX "TicketHistory_previousStatus_newStatus_idx" ON "TicketHistory"("previousStatus", "newStatus");

ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "SupportTeam"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "TicketCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SupportTeamMember" ADD CONSTRAINT "SupportTeamMember_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "SupportTeam"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TicketTagAssignment" ADD CONSTRAINT "TicketTagAssignment_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TicketTagAssignment" ADD CONSTRAINT "TicketTagAssignment_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "TicketTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TicketAssignment" ADD CONSTRAINT "TicketAssignment_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TicketAssignment" ADD CONSTRAINT "TicketAssignment_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "SupportTeam"("id") ON DELETE SET NULL ON UPDATE CASCADE;
