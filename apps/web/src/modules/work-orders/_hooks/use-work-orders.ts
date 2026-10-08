'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from '@/modules/auth/hooks/use-session';
import type {
  AssignWorkOrderDto,
  CreateWorkOrderDto,
  UpdateWorkOrderDto,
  UpdateWorkOrderStatusDto,
} from '../_api/api.types';
import {
  assignWorkOrder,
  createWorkOrder,
  updateWorkOrder,
  updateWorkOrderStatus,
} from '../_api/work-orders-mutations';
import { getWorkOrderById, getWorkOrders } from '../_api/work-orders-query';
import { workOrdersKeys, type WorkOrdersListParams } from '../_api/work-orders-keys';

export function useWorkOrders(params: WorkOrdersListParams) {
  const { session } = useSession();
  const orgId = session.data?.organisation.id ?? '';

  return useQuery({
    queryKey: workOrdersKeys.list(orgId, params),
    queryFn: ({ signal }) => getWorkOrders(params, signal),
    enabled: Boolean(orgId),
  });
}

export function useWorkOrder(id: string) {
  const { session } = useSession();
  const orgId = session.data?.organisation.id ?? '';

  return useQuery({
    queryKey: workOrdersKeys.detail(orgId, id),
    queryFn: ({ signal }) => getWorkOrderById(id, signal),
    enabled: Boolean(orgId && id),
  });
}

export function useCreateWorkOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateWorkOrderDto) => createWorkOrder(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: workOrdersKeys.lists() });
    },
  });
}

export function useUpdateWorkOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateWorkOrderDto }) =>
      updateWorkOrder(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: workOrdersKeys.lists() });
      void queryClient.invalidateQueries({
        queryKey: workOrdersKeys.details(),
      });
    },
  });
}

export function useAssignWorkOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: AssignWorkOrderDto }) =>
      assignWorkOrder(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: workOrdersKeys.lists() });
      void queryClient.invalidateQueries({
        queryKey: workOrdersKeys.details(),
      });
    },
  });
}

export function useUpdateWorkOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateWorkOrderStatusDto }) =>
      updateWorkOrderStatus(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: workOrdersKeys.lists() });
      void queryClient.invalidateQueries({
        queryKey: workOrdersKeys.details(),
      });
    },
  });
}
