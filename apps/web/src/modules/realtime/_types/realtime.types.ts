export type RealtimeEventType =
  | 'WORK_ORDER_CREATED'
  | 'WORK_ORDER_UPDATED'
  | 'WORK_ORDER_ASSIGNED'
  | 'WORK_ORDER_STATUS_CHANGED'
  | 'PROGRESS_EVENT_ADDED'
  | 'ping';

export interface RealtimeEventPayload<T = unknown> {
  id: string;
  type: RealtimeEventType;
  organisationId: string;
  workOrderId: string;
  occurredAt: string;
  data: T;
}

export type ConnectionStatus = 'connected' | 'reconnecting' | 'disconnected';
