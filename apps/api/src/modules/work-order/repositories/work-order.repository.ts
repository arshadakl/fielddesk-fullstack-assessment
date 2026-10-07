import type { Prisma } from '@fielddesk/database';
import { ConflictException, Injectable } from '@nestjs/common';

import { PrismaService } from '../../../database/prisma.service';
import type {
  AssignWorkOrderInput,
  PaginatedWorkOrders,
  PaginationParams,
  UpdateWorkOrderInput,
  UpdateWorkOrderStatusInput,
  WorkOrderFilterInput,
  WorkOrderSummary,
} from '../interfaces/work-order.interface';
import type {
  CreateWorkOrderEntityInput,
  WorkOrderRepositoryPort,
} from '../interfaces/work-order-repository.interface';

const workOrderSelect = {
  id: true,
  organisationId: true,
  reference: true,
  title: true,
  description: true,
  priority: true,
  status: true,
  siteName: true,
  creatorId: true,
  creator: { select: { name: true } },
  assignedTechnicianId: true,
  assignedTechnician: { select: { name: true } },
  scheduledStart: true,
  scheduledEnd: true,
  createdAt: true,
  updatedAt: true,
} as const;

type PrismaWorkOrderResult = Prisma.WorkOrderGetPayload<{
  select: typeof workOrderSelect;
}>;

function mapWorkOrder(record: PrismaWorkOrderResult): WorkOrderSummary {
  return {
    id: record.id,
    organisationId: record.organisationId,
    reference: record.reference,
    title: record.title,
    description: record.description,
    priority: record.priority,
    status: record.status,
    siteName: record.siteName,
    creatorId: record.creatorId,
    creatorName: record.creator.name,
    assignedTechnicianId: record.assignedTechnicianId,
    assignedTechnicianName: record.assignedTechnician?.name ?? null,
    scheduledStart: record.scheduledStart,
    scheduledEnd: record.scheduledEnd,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

@Injectable()
export class WorkOrderRepository implements WorkOrderRepositoryPort {
  constructor(private readonly database: PrismaService) {}

  async findById(
    organisationId: string,
    workOrderId: string,
  ): Promise<WorkOrderSummary | null> {
    const record = await this.database.client.workOrder.findFirst({
      where: { id: workOrderId, organisationId },
      select: workOrderSelect,
    });
    return record ? mapWorkOrder(record) : null;
  }

  async listByOrganisation(
    organisationId: string,
    filter: WorkOrderFilterInput,
    pagination: PaginationParams,
  ): Promise<PaginatedWorkOrders> {
    const trimmedSearch = filter.search?.trim();
    const where: Prisma.WorkOrderWhereInput = {
      organisationId,
      ...(filter.status ? { status: filter.status } : {}),
      ...(filter.priority ? { priority: filter.priority } : {}),
      ...(filter.assignedTechnicianId
        ? { assignedTechnicianId: filter.assignedTechnicianId }
        : {}),
      ...(trimmedSearch
        ? {
            OR: [
              { title: { contains: trimmedSearch, mode: 'insensitive' } },
              { reference: { contains: trimmedSearch, mode: 'insensitive' } },
              { siteName: { contains: trimmedSearch, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const skip = (pagination.page - 1) * pagination.limit;
    const take = pagination.limit;

    const [records, total] = await Promise.all([
      this.database.client.workOrder.findMany({
        where,
        select: workOrderSelect,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.database.client.workOrder.count({ where }),
    ]);

    return {
      items: records.map(mapWorkOrder),
      total,
      page: pagination.page,
      limit: pagination.limit,
    };
  }

  countByOrganisation(organisationId: string): Promise<number> {
    return this.database.client.workOrder.count({
      where: { organisationId },
    });
  }

  private async lockOrganisation(
    transaction: Prisma.TransactionClient,
    organisationId: string,
  ): Promise<void> {
    await transaction.$queryRaw`SELECT id FROM "Organisation" WHERE id = ${organisationId}::uuid FOR UPDATE`;
  }

  async create(
    organisationId: string,
    input: CreateWorkOrderEntityInput,
  ): Promise<WorkOrderSummary> {
    try {
      return await this.database.client.$transaction(async (tx) => {
        await this.lockOrganisation(tx, organisationId);

        const count = await tx.workOrder.count({
          where: { organisationId },
        });
        const reference = `WO-${String(count + 1).padStart(4, '0')}`;

        const record = await tx.workOrder.create({
          data: {
            organisationId,
            reference,
            title: input.title,
            description: input.description,
            priority: input.priority,
            status: input.assignedTechnicianId ? 'SCHEDULED' : 'DRAFT',
            siteName: input.siteName,
            creatorId: input.creatorId,
            assignedTechnicianId: input.assignedTechnicianId,
            scheduledStart: input.scheduledStart,
            scheduledEnd: input.scheduledEnd,
          },
          select: workOrderSelect,
        });
        return mapWorkOrder(record);
      });
    } catch (error: unknown) {
      this.handleDatabaseError(error);
      throw error;
    }
  }

  async update(
    organisationId: string,
    workOrderId: string,
    input: UpdateWorkOrderInput,
  ): Promise<WorkOrderSummary | null> {
    const existing = await this.database.client.workOrder.findFirst({
      where: { id: workOrderId, organisationId },
      select: { id: true },
    });
    if (!existing) {
      return null;
    }

    const record = await this.database.client.workOrder.update({
      where: { id: workOrderId },
      data: {
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.description !== undefined
          ? { description: input.description }
          : {}),
        ...(input.priority !== undefined ? { priority: input.priority } : {}),
        ...(input.siteName !== undefined ? { siteName: input.siteName } : {}),
      },
      select: workOrderSelect,
    });
    return mapWorkOrder(record);
  }

  async updateAssignment(
    organisationId: string,
    workOrderId: string,
    input: AssignWorkOrderInput,
  ): Promise<WorkOrderSummary | null> {
    const existing = await this.database.client.workOrder.findFirst({
      where: { id: workOrderId, organisationId },
      select: { id: true, status: true },
    });
    if (!existing) {
      return null;
    }

    try {
      const record = await this.database.client.workOrder.update({
        where: { id: workOrderId },
        data: {
          assignedTechnicianId: input.assignedTechnicianId,
          scheduledStart: input.scheduledStart,
          scheduledEnd: input.scheduledEnd,
          status: 'SCHEDULED',
        },
        select: workOrderSelect,
      });
      return mapWorkOrder(record);
    } catch (error: unknown) {
      this.handleDatabaseError(error);
      throw error;
    }
  }

  async updateStatus(
    organisationId: string,
    workOrderId: string,
    input: UpdateWorkOrderStatusInput,
  ): Promise<WorkOrderSummary | null> {
    const existing = await this.database.client.workOrder.findFirst({
      where: { id: workOrderId, organisationId },
      select: { id: true },
    });
    if (!existing) {
      return null;
    }

    const record = await this.database.client.workOrder.update({
      where: { id: workOrderId },
      data: { status: input.status },
      select: workOrderSelect,
    });
    return mapWorkOrder(record);
  }

  private handleDatabaseError(error: unknown): void {
    if (typeof error === 'object' && error !== null) {
      const errStr = String((error as { message?: string }).message ?? '');
      const errCode = String((error as { code?: string }).code ?? '');

      if (
        errCode === '23P01' ||
        errStr.includes('WorkOrder_technician_no_overlap') ||
        errStr.includes('exclusion constraint') ||
        errStr.includes('conflicting key value violates exclusion constraint')
      ) {
        throw new ConflictException(
          'Technician already has a scheduled work order in this time window',
        );
      }
      if (
        errCode === 'P2003' ||
        errStr.includes('WorkOrder_assignedTechnician_tenant_fkey') ||
        errStr.includes('WorkOrder_assignedTechnicianId_fkey')
      ) {
        throw new ConflictException(
          'Assigned technician does not belong to this organisation',
        );
      }
    }
  }
}
