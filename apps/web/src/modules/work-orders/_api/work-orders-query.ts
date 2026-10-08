import { apiClient } from '@/api/client';
import type { WorkOrderListResDto, WorkOrderResDto } from './api.types';
import type { WorkOrdersListParams } from './work-orders-keys';

export async function getWorkOrders(
  params: WorkOrdersListParams,
  signal?: AbortSignal,
): Promise<WorkOrderListResDto> {
  const { data, error } = await apiClient().GET('/api/v1/work-orders', {
    params: {
      query: {
        status: params.status,
        priority: params.priority,
        assignedTechnicianId: params.assignedTechnicianId,
        search: params.search,
        page: params.page,
        limit: params.limit,
      },
    },
    signal,
  });
  if (error || !data) {
    throw error || new Error('Failed to load work orders');
  }
  return data;
}

export async function getWorkOrderById(
  id: string,
  signal?: AbortSignal,
): Promise<WorkOrderResDto> {
  const { data, error } = await apiClient().GET('/api/v1/work-orders/{id}', {
    params: { path: { id } },
    signal,
  });
  if (error || !data) {
    throw error || new Error('Failed to load work order');
  }
  return data;
}
