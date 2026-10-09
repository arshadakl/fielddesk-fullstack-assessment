'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from '@/modules/auth/hooks/use-session';
import { notificationsKeys } from '../_api/notifications-keys';
import {
  clearAllNotifications,
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from '../_api/notifications-query';

export function useNotifications(limit = 25) {
  const { session } = useSession();
  const queryClient = useQueryClient();
  const user = session.data;
  const orgId = user?.organisation.id;
  const userId = user?.id;

  const queryKey = orgId && userId ? notificationsKeys.list(orgId, userId) : ['notifications'];

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: ({ signal }) => getNotifications(limit, signal),
    enabled: Boolean(orgId && userId),
    staleTime: 1000 * 30, // 30 seconds
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => markNotificationAsRead(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: notificationsKeys.all });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => markAllNotificationsAsRead(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: notificationsKeys.all });
    },
  });

  const clearAllMutation = useMutation({
    mutationFn: () => clearAllNotifications(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: notificationsKeys.all });
    },
  });

  return {
    notifications: data?.items ?? [],
    unreadCount: data?.unreadCount ?? 0,
    isLoading,
    markAsRead: (id: string) => markAsReadMutation.mutate(id),
    markAllAsRead: () => markAllAsReadMutation.mutate(),
    clearAll: () => clearAllMutation.mutate(),
  };
}
