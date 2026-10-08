import { Test } from '@nestjs/testing';
import type { TestingModule } from '@nestjs/testing';
import { Subject } from 'rxjs';
import { take } from 'rxjs/operators';
import { RedisPubSubService } from '../../../infrastructure/redis/redis-pubsub.service';
import type { RealtimeEventPayload } from '../interfaces/realtime.interface';
import { RealtimeService } from './realtime.service';

describe('RealtimeService', () => {
  let service: RealtimeService;
  let mockPubSub: {
    getChannelName: jest.Mock;
    publish: jest.Mock;
    subscribe: jest.Mock;
  };
  let messageSubject: Subject<string>;

  beforeEach(async () => {
    messageSubject = new Subject<string>();
    mockPubSub = {
      getChannelName: jest.fn(
        (orgId: string) => `test-prefix:events:org:${orgId}`,
      ),
      publish: jest.fn().mockResolvedValue(undefined),
      subscribe: jest.fn(() => messageSubject.asObservable()),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RealtimeService,
        {
          provide: RedisPubSubService,
          useValue: mockPubSub,
        },
      ],
    }).compile();

    service = module.get<RealtimeService>(RealtimeService);
  });

  afterEach(() => {
    messageSubject.complete();
  });

  it('broadcasts an event with enriched UUID and ISO timestamp to the tenant channel', async () => {
    const orgId = 'org-clearbrook';
    await service.broadcastToOrganisation(orgId, {
      type: 'WORK_ORDER_CREATED',
      workOrderId: 'wo-123',
      data: { title: 'Test WO' },
    });

    expect(mockPubSub.getChannelName).toHaveBeenCalledWith(orgId);
    expect(mockPubSub.publish).toHaveBeenCalledWith(
      `test-prefix:events:org:${orgId}`,
      expect.objectContaining({
        type: 'WORK_ORDER_CREATED',
        workOrderId: 'wo-123',
        organisationId: orgId,
        id: expect.stringMatching(/^evt_/) as unknown,
        occurredAt: expect.any(String) as unknown,
        data: { title: 'Test WO' },
      }),
    );
  });

  it('transforms subscribed Redis JSON events into SSE formatted events', () => {
    const orgId = 'org-clearbrook';
    const stream$ = service.createEventStream(orgId);

    const received: unknown[] = [];
    const sub = stream$.subscribe((event) => {
      received.push(event);
    });

    const payload: RealtimeEventPayload = {
      id: 'evt_test_1',
      type: 'WORK_ORDER_STATUS_CHANGED',
      organisationId: orgId,
      workOrderId: 'wo-123',
      occurredAt: new Date().toISOString(),
      data: { status: 'IN_PROGRESS' },
    };

    messageSubject.next(JSON.stringify(payload));

    // Verify first event is ping or message
    expect(received.length).toBeGreaterThanOrEqual(1);
    const domainEvent = received.find(
      (e: unknown) =>
        typeof e === 'object' &&
        e !== null &&
        'type' in e &&
        (e as { type: string }).type === 'WORK_ORDER_STATUS_CHANGED',
    );

    expect(domainEvent).toBeDefined();
    expect((domainEvent as { id: string }).id).toBe('evt_test_1');

    sub.unsubscribe();
  });

  it('emits an initial ping heartbeat on stream creation', (done) => {
    const orgId = 'org-clearbrook';
    const stream$ = service.createEventStream(orgId);

    stream$.pipe(take(1)).subscribe((firstEvent) => {
      expect(firstEvent.type).toBe('ping');
      expect(firstEvent.id).toMatch(/^ping_/);
      done();
    });
  });
});
