import { apiClient } from '@/api/client';
import type {
  InAppNotificationItemDto,
  InAppNotificationListResDto,
} from './api.types';

export async function getNotifications(
  limit = 25,
  signal?: AbortSignal,
): Promise<InAppNotificationListResDto> {
  const { data, error } = await apiClient().GET('/api/v1/notifications', {
    params: {
      query: { limit },
    },
    signal,
  });

  if (error || !data) {
    throw error || new Error('Failed to load notifications');
  }

  return data;
}

export async function markNotificationAsRead(
  id: string,
): Promise<InAppNotificationItemDto> {
  const { data, error } = await apiClient().PATCH(
    '/api/v1/notifications/{id}/read',
    {
      params: { path: { id } },
    },
  );

  if (error || !data) {
    throw error || new Error('Failed to mark notification as read');
  }

  return data;
}

export async function markAllNotificationsAsRead(): Promise<void> {
  const { error } = await apiClient().PATCH(
    '/api/v1/notifications/read-all',
  );

  if (error) {
    throw error;
  }
}

export async function clearAllNotifications(): Promise<void> {
  const { error } = await apiClient().DELETE('/api/v1/notifications');

  if (error) {
    throw error;
  }
}
