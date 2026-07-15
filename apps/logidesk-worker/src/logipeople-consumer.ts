import { Redis } from 'ioredis';
import { Pool } from 'pg';
import { createPlatformLogger } from '@logipeople/logger';
import { randomUUID } from 'crypto';

type PlatformLogger = ReturnType<typeof createPlatformLogger>;

interface ConsumerConfig {
  consumerName: string;
  streamName: string;
  batchSize: number;
  blockMs: number;
}

export class LogipeopleConsumer {
  private logideskApiUrl: string;
  private serviceToken: string;

  constructor(
    private pool: Pool | null,
    private redis: Redis,
    private logger: PlatformLogger,
    private config: ConsumerConfig,
  ) {
    this.logideskApiUrl = (process.env.LOGIDESK_API_URL ?? 'http://localhost:3533/api/v1').replace(/\/$/, '');
    this.serviceToken = process.env.LOGIDESK_SERVICE_TOKEN ?? '';
  }

  async consumeNextBatch() {
    if (!this.pool) return;

    try {
      await this.ensureConsumerGroup();

      const results = (await this.redis.xreadgroup(
        'GROUP',
        this.config.consumerName,
        this.config.consumerName,
        'COUNT',
        this.config.batchSize,
        'BLOCK',
        this.config.blockMs,
        'STREAMS',
        this.config.streamName,
        '>',
      )) as Array<[string, Array<[string, string[]]>]> | null;

      const streamResult = results?.[0];
      if (!streamResult) return;

      const [, messages] = streamResult;

      for (const [messageId, fields] of messages) {
        await this.processMessage(messageId, fields);
      }
    } catch (error) {
      this.logger.error(
        { operation: 'consumer.poll', stream: this.config.streamName, error: error instanceof Error ? error.message : 'Unknown error' },
        'Consumer poll failed',
      );
    }
  }

  private async ensureConsumerGroup() {
    try {
      await this.redis.xgroup('CREATE', this.config.streamName, this.config.consumerName, '0', 'MKSTREAM');
    } catch (error) {
      if (error instanceof Error && error.message.includes('BUSYGROUP')) {
        return;
      }
      throw error;
    }
  }

  private async processMessage(messageId: string, fields: string[]) {
    if (!this.pool) return;

    const event = this.parseFields(fields);
    const eventId = event.eventId;

    if (!eventId) {
      await this.redis.xack(this.config.streamName, this.config.consumerName, messageId);
      return;
    }

    if (event.eventType !== 'logipeople.hr_case.status_changed') {
      await this.redis.xack(this.config.streamName, this.config.consumerName, messageId);
      return;
    }

    if (event.status !== 'completed' && event.status !== 'processed') {
      if (!event.payload) {
        await this.redis.xack(this.config.streamName, this.config.consumerName, messageId);
        return;
      }
    }

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      const insertInbox = await client.query(
        `
          INSERT INTO "InboxMessage" (id, "eventId", "eventType", "eventVersion", payload, producer, "correlationId")
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT ("eventId") DO NOTHING
        `,
        [
          randomUUID(),
          eventId,
          event.eventType,
          event.eventVersion,
          event.payload,
          event.producer,
          event.correlationId,
        ],
      );

      if (insertInbox.rowCount === 0) {
        this.logger.warn({ eventId }, 'Message already in Inbox (idempotent skip)');
      } else {
        const payload = JSON.parse(event.payload ?? '{}');

        // When HR case status changes in LogiPeople, we map it to LogiDesk Ticket Status
        // hrCaseId is the UUID of the HR Case. ticketId should be available or we can find it by querying logidesk API?
        // Wait, logipeople.hr_case.status_changed has hrCaseId. We need ticketId.
        // The event contract says:
        // hrCaseId: uuidSchema
        // previousStatus: logipeopleHrCaseStatusSchema
        // newStatus: logipeopleHrCaseStatusSchema
        // Wait, LogiDesk ticket needs ticketId to update status. How do we get the ticketId?
        // In the integration, LogiDesk sent ticketId to LogiPeople, which saved it in HrCase.
        // We might need LogiPeople to include ticketId in logipeople.hr_case.status_changed!
        // But the event contract does not have ticketId.

        // Wait! We can call a custom endpoint on LogiDesk API: PATCH /api/v1/integrations/logipeople/hr-cases/:hrCaseId/status
        const body = {
          newStatus: payload.newStatus,
          previousStatus: payload.previousStatus,
        };

        const headers: Record<string, string> = {
          'content-type': 'application/json',
          'x-service-token': this.serviceToken,
        };
        if (eventId) headers['idempotency-key'] = eventId;
        if (event.correlationId) headers['x-correlation-id'] = event.correlationId;

        const response = await fetch(`${this.logideskApiUrl}/integrations/logipeople/hr-cases/${payload.hrCaseId}/status`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify(body),
        });

        const responseBody = await response.text();
        if (!response.ok) {
          throw new Error(`LogiDesk API responded ${response.status}: ${responseBody.slice(0, 500)}`);
        }

        await client.query(
          `
            UPDATE "InboxMessage"
            SET "processedAt" = NOW()
            WHERE "eventId" = $1
          `,
          [eventId],
        );

        this.logger.info(
          { operation: 'consumer.process', eventId, correlationId: event.correlationId },
          'Processed logipeople.hr_case.status_changed event successfully',
        );
      }

      await client.query(
        `
          INSERT INTO "ConsumerCheckpoint" (id, "consumerName", "streamName", "lastMessageId", "updatedAt")
          VALUES ($1, $2, $3, $4, NOW())
          ON CONFLICT ("consumerName") DO UPDATE
          SET "lastMessageId" = $4, "updatedAt" = NOW()
        `,
        [randomUUID(), this.config.consumerName, this.config.streamName, messageId],
      );

      await client.query('COMMIT');
      await this.redis.xack(this.config.streamName, this.config.consumerName, messageId);
    } catch (error) {
      await client.query('ROLLBACK');
      this.logger.error(
        { operation: 'consumer.process', eventId, error: error instanceof Error ? error.message : 'Unknown' },
        'Failed to process message from LogiPeople',
      );
    } finally {
      client.release();
    }
  }

  private parseFields(fields: string[]) {
    const obj: Record<string, string> = {};
    for (let i = 0; i < fields.length; i += 2) {
      const key = fields[i];
      if (key !== undefined) {
        obj[key] = fields[i + 1] ?? '';
      }
    }
    return {
      eventId: obj.eventId,
      eventType: obj.eventType,
      eventVersion: parseInt(obj.eventVersion || '1', 10),
      correlationId: obj.correlationId,
      causationId: obj.causationId,
      producer: obj.producer,
      status: obj.status,
      payload: obj.payload,
    };
  }
}
