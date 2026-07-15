ALTER TABLE "DriverProfile" ADD COLUMN "employeeId" TEXT;

CREATE UNIQUE INDEX "DriverProfile_employeeId_key" ON "DriverProfile"("employeeId");

CREATE TABLE "InboxMessage" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "producer" TEXT NOT NULL,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InboxMessage_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "InboxMessage_eventId_key" ON "InboxMessage"("eventId");

CREATE TABLE "ConsumerCheckpoint" (
    "id" TEXT NOT NULL,
    "consumerName" TEXT NOT NULL,
    "streamName" TEXT NOT NULL,
    "lastMessageId" TEXT NOT NULL DEFAULT '0-0',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConsumerCheckpoint_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ConsumerCheckpoint_consumerName_key" ON "ConsumerCheckpoint"("consumerName");
