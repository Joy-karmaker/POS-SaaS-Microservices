import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { RabbitMqService } from '../../rabbitmq/rabbitmq.service';
import { TenantConnectionService } from '../../tenant/tenant-connection.service';

export interface OutboxEventInput {
  aggregateType: string;
  aggregateId: string;
  eventType: string;
  payload: any;
}

@Injectable()
export class OutboxService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OutboxService.name);
  private timer: NodeJS.Timeout | null = null;
  private knownTenants = new Set<number>();

  constructor(
    private rabbitMqService: RabbitMqService,
    private tenantConnectionService: TenantConnectionService,
  ) {}

  onModuleInit() {
    // Run outbox publisher check every 5 seconds
    this.timer = setInterval(() => {
      this.flushAllOutboxes().catch((err) => {
        this.logger.error(`Outbox worker flush error: ${err.message}`);
      });
    }, 5000);
  }

  registerTenant(tenantId: number) {
    this.knownTenants.add(Number(tenantId));
  }

  /**
   * Records an outbox event into the tenant DB within an active transaction or client connection.
   */
  async recordEvent(tenantId: number, event: OutboxEventInput): Promise<void> {
    this.registerTenant(tenantId);
    const client = await this.tenantConnectionService.getClient(tenantId);

    await client.outboxEvent.create({
      data: {
        aggregate_type: event.aggregateType,
        aggregate_id: String(event.aggregateId),
        event_type: event.eventType,
        payload: JSON.stringify(event.payload),
        status: 'PENDING',
      },
    });

    // Proactively flush immediately for instant low latency
    setImmediate(() => {
      this.flushTenantOutbox(tenantId).catch(() => {});
    });
  }

  /**
   * Flushes pending events for a specific tenant to RabbitMQ.
   */
  async flushTenantOutbox(tenantId: number): Promise<number> {
    try {
      const client = await this.tenantConnectionService.getClient(tenantId);
      const pendingEvents = await client.outboxEvent.findMany({
        where: { status: 'PENDING' },
        take: 50,
        orderBy: { created_at: 'asc' },
      });

      if (pendingEvents.length === 0) return 0;

      let publishedCount = 0;

      for (const ev of pendingEvents) {
        try {
          const payload = JSON.parse(ev.payload);
          const routingKey = ev.event_type;

          const published = await this.rabbitMqService.publish(routingKey, payload);

          if (published) {
            await client.outboxEvent.update({
              where: { id: ev.id },
              data: {
                status: 'PUBLISHED',
                published_at: new Date(),
              },
            });
            publishedCount++;
          } else {
            this.logger.warn(`RabbitMQ publish returned false for event #${ev.id} (${ev.event_type})`);
          }
        } catch (err: any) {
          this.logger.error(`Failed to publish outbox event #${ev.id}: ${err.message}`);
          await client.outboxEvent.update({
            where: { id: ev.id },
            data: {
              retry_count: { increment: 1 },
              error_message: err.message,
            },
          });
        }
      }

      if (publishedCount > 0) {
        this.logger.log(`Flushed ${publishedCount} outbox events for Tenant #${tenantId}`);
      }
      return publishedCount;
    } catch (err: any) {
      this.logger.warn(`Error flushing outbox for Tenant #${tenantId}: ${err.message}`);
      return 0;
    }
  }

  private async flushAllOutboxes() {
    for (const tenantId of this.knownTenants) {
      await this.flushTenantOutbox(tenantId);
    }
  }

  onModuleDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}
