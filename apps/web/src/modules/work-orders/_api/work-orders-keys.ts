import type { WorkOrderPriority, WorkOrderStatus } from './api.types';

export interface WorkOrdersListParams {
  status?: WorkOrderStatus;
  priority?: WorkOrderPriority;
  assignedTechnicianId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export const workOrdersKeys = {
  all: ['work-orders'] as const,
  lists: () => [...workOrdersKeys.all, 'list'] as const,
  list: (orgId: string, params: WorkOrdersListParams) =>
    [...workOrdersKeys.lists(), orgId, params] as const,
  details: () => [...workOrdersKeys.all, 'detail'] as const,
  detail: (orgId: string, id: string) =>
    [...workOrdersKeys.details(), orgId, id] as const,
};
