import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { merge, Observable, timer } from 'rxjs';
import { map } from 'rxjs/operators';

import { RedisPubSubService } from '../../../infrastructure/redis/redis-pubsub.service';
import type {
  RealtimeEventPayload,
  RealtimeServerEvent,
} from '../interfaces/realtime.interface';

@Injectable()
export class RealtimeService {
  private readonly logger = new Logger(RealtimeService.name);

  constructor(private readonly pubSub: RedisPubSubService) {}

  /**
   * Broadcast an event to an organisation's isolated Redis channel.
   * Runs non-blocking to prevent Redis glitches from failing business mutations.
   */
  async broadcastToOrganisation(
    organisationId: string,
    event: Omit<RealtimeEventPayload, 'id' | 'occurredAt' | 'organisationId'>,
  ): Promise<void> {
    const channel = this.pubSub.getChannelName(organisationId);
    const fullEvent: RealtimeEventPayload = {
      id: `evt_${randomUUID()}`,
      occurredAt: new Date().toISOString(),
      organisationId,
      ...event,
    };

    this.logger.debug(
      `Broadcasting ${fullEvent.type} to organisation ${organisationId} (WO: ${fullEvent.workOrderId})`,
    );

    await this.pubSub.publish(channel, fullEvent);
  }

  /**
   * Creates an SSE-compliant stream for the given tenant organisation.
   * Merges real-time domain events with a 15-second heartbeat ping.
   */
  createEventStream(organisationId: string): Observable<RealtimeServerEvent> {
    const channel = this.pubSub.getChannelName(organisationId);

    // 1. Domain events stream from Redis Pub/Sub
    const domainEvents$ = this.pubSub.subscribe(channel).pipe(
      map((rawMessage: string): RealtimeServerEvent => {
        try {
          const parsed = JSON.parse(rawMessage) as RealtimeEventPayload;
          return {
            id: parsed.id,
            type: parsed.type,
            data: JSON.stringify(parsed),
            retry: 5000, // Hint to browser EventSource to retry after 5s if disconnected
          };
        } catch {
          return {
            id: `evt_${randomUUID()}`,
            type: 'MESSAGE',
            data: rawMessage,
            retry: 5000,
          };
        }
      }),
    );

    // 2. Keep-alive heartbeat stream every 15 seconds to prevent proxy / NAT timeouts
    const heartbeats$ = timer(0, 15000).pipe(
      map((): RealtimeServerEvent => ({
        id: `ping_${Date.now()}`,
        type: 'ping',
        data: JSON.stringify({ timestamp: new Date().toISOString() }),
      })),
    );

    return merge<[RealtimeServerEvent, RealtimeServerEvent]>(
      domainEvents$,
      heartbeats$,
    );
  }
}
