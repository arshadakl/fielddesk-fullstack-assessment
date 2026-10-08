'use client';

import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useSession } from '@/modules/auth/hooks/use-session';
import { workOrdersKeys } from '@/modules/work-orders/_api/work-orders-keys';
import type {
  ConnectionStatus,
  RealtimeEventPayload,
} from '../_types/realtime.types';

export function useRealtimeEvents(): { status: ConnectionStatus } {
  const { session } = useSession();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const eventSourceRef = useRef<EventSource | null>(null);

  const user = session.data;
  const orgId = user?.organisation.id;

  useEffect(() => {
    // Only connect when an authenticated user session is active
    if (!orgId) {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      return;
    }

    const apiBase =
      process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const streamUrl = `${apiBase}/api/v1/realtime/stream`;

    const es = new EventSource(streamUrl, { withCredentials: true });
    eventSourceRef.current = es;

    es.onopen = () => {
      setStatus('connected');
    };

    es.onerror = () => {
      // EventSource automatically enters reconnection loop
      setStatus('reconnecting');
    };

    es.onmessage = (event: MessageEvent) => {
      try {
        if (!event.data) return;
        const payload = JSON.parse(event.data) as RealtimeEventPayload;

        // Skip internal keep-alive heartbeats
        if (payload.type === 'ping') {
          return;
        }

        // Handle domain events with targeted cache invalidation
        switch (payload.type) {
          case 'WORK_ORDER_CREATED': {
            void queryClient.invalidateQueries({
              queryKey: workOrdersKeys.lists(),
            });
            const data = payload.data as { reference?: string; title?: string };
            toast.info(
              `New work order ${data.reference ?? ''} created: ${data.title ?? ''}`,
            );
            break;
          }

          case 'WORK_ORDER_UPDATED':
          case 'WORK_ORDER_ASSIGNED':
          case 'WORK_ORDER_STATUS_CHANGED': {
            void queryClient.invalidateQueries({
              queryKey: workOrdersKeys.lists(),
            });
            void queryClient.invalidateQueries({
              queryKey: workOrdersKeys.detail(orgId, payload.workOrderId),
            });
            break;
          }

          case 'PROGRESS_EVENT_ADDED': {
            void queryClient.invalidateQueries({
              queryKey: workOrdersKeys.events(orgId, payload.workOrderId),
            });
            void queryClient.invalidateQueries({
              queryKey: workOrdersKeys.detail(orgId, payload.workOrderId),
            });
            void queryClient.invalidateQueries({
              queryKey: workOrdersKeys.lists(),
            });
            break;
          }

          default:
            break;
        }
      } catch {
        // Ignore unparseable frames safely
      }
    };

    return () => {
      es.close();
      eventSourceRef.current = null;
      setStatus('disconnected');
    };
  }, [orgId, queryClient]);

  return { status };
}
