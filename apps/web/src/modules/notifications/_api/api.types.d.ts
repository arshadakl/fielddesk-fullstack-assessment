import type { components, operations } from '@/api/schema';

export type InAppNotificationItemDto =
  components['schemas']['InAppNotificationItemDto'];

export type InAppNotificationListResDto =
  components['schemas']['InAppNotificationListResDto'];

export type ListNotificationsQueryParams =
  operations['NotificationsController_list']['parameters']['query'];
