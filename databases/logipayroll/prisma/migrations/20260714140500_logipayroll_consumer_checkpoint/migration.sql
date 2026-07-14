CREATE TABLE "ConsumerCheckpoint" (
    "id" TEXT NOT NULL,
    "consumerName" TEXT NOT NULL,
    "streamName" TEXT NOT NULL,
    "lastMessageId" TEXT NOT NULL DEFAULT '0-0',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConsumerCheckpoint_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ConsumerCheckpoint_consumerName_key" ON "ConsumerCheckpoint"("consumerName");
