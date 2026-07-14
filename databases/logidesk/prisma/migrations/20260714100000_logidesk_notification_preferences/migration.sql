CREATE TABLE "NotificationPreference" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "inAppEnabled" BOOLEAN NOT NULL DEFAULT true,
  "emailEnabled" BOOLEAN NOT NULL DEFAULT false,
  "assignmentEnabled" BOOLEAN NOT NULL DEFAULT true,
  "slaEnabled" BOOLEAN NOT NULL DEFAULT true,
  "messageEnabled" BOOLEAN NOT NULL DEFAULT true,
  "updatedById" TEXT,
  "correlationId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "NotificationPreference_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "NotificationPreference_userId_key" ON "NotificationPreference"("userId");
CREATE INDEX "NotificationPreference_updatedAt_idx" ON "NotificationPreference"("updatedAt");
