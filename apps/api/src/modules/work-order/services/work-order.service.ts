import type { WorkOrderStatus } from '@fielddesk/database';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type { TenantContext } from '../../../common/interfaces/tenant-context.interface';
import { UserService } from '../../user/services/user.service';
import { WORK_ORDER_REPOSITORY } from '../interfaces/work-order-repository.interface';
import type { WorkOrderRepositoryPort } from '../interfaces/work-order-repository.interface';
import type {
  AssignWorkOrderInput,
  CreateWorkOrderInput,
  PaginatedWorkOrders,
  PaginationParams,
  UpdateWorkOrderInput,
  UpdateWorkOrderStatusInput,
  WorkOrderFilterInput,
  WorkOrderSummary,
} from '../interfaces/work-order.interface';

const PERMITTED_TRANSITIONS: Record<WorkOrderStatus, WorkOrderStatus[]> = {
  DRAFT: ['SCHEDULED', 'CANCELLED'],
  SCHEDULED: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
};

@Injectable()
export class WorkOrderService {
  constructor(
    @Inject(WORK_ORDER_REPOSITORY)
    private readonly repository: WorkOrderRepositoryPort,
    private readonly users: UserService,
  ) {}

  async getById(
    context: TenantContext,
    workOrderId: string,
    userRole: string,
    userId: string,
  ): Promise<WorkOrderSummary> {
    const workOrder = await this.repository.findById(
      context.organisationId,
      workOrderId,
    );
    if (!workOrder) {
      throw new NotFoundException('Resource not found');
    }

    // Technicians may only view work orders assigned to them
    if (userRole === 'TECHNICIAN' && workOrder.assignedTechnicianId !== userId) {
      throw new NotFoundException('Resource not found');
    }

    return workOrder;
  }

  async list(
    context: TenantContext,
    filter: WorkOrderFilterInput,
    pagination: PaginationParams,
    userRole: string,
    userId: string,
  ): Promise<PaginatedWorkOrders> {
    // If user is a technician, enforce that they only see their assigned work
    const effectiveFilter: WorkOrderFilterInput = {
      ...filter,
      ...(userRole === 'TECHNICIAN' ? { assignedTechnicianId: userId } : {}),
    };

    return this.repository.listByOrganisation(
      context.organisationId,
      effectiveFilter,
      pagination,
    );
  }

  async create(
    context: TenantContext,
    creatorId: string,
    input: CreateWorkOrderInput,
  ): Promise<WorkOrderSummary> {
    if (input.scheduledStart || input.scheduledEnd) {
      if (!input.scheduledStart || !input.scheduledEnd) {
        throw new BadRequestException(
          'Both scheduled start and end time must be provided',
        );
      }
      if (input.scheduledStart >= input.scheduledEnd) {
        throw new BadRequestException(
          'Scheduled start time must precede scheduled end time',
        );
      }
      const minAllowed = new Date(Date.now() - 5 * 60 * 1000);
      if (input.scheduledStart < minAllowed) {
        throw new BadRequestException('Scheduled start time cannot be in the past');
      }
    }

    if (input.assignedTechnicianId) {
      await this.validateTechnician(context, input.assignedTechnicianId);
      if (!input.scheduledStart || !input.scheduledEnd) {
        throw new BadRequestException(
          'Scheduled start and end time are required when assigning a technician',
        );
      }
    }

    return this.repository.create(context.organisationId, {
      ...input,
      title: input.title.trim(),
      description: input.description.trim(),
      siteName: input.siteName.trim(),
      creatorId,
    });
  }

  async update(
    context: TenantContext,
    workOrderId: string,
    input: UpdateWorkOrderInput,
  ): Promise<WorkOrderSummary> {
    const existing = await this.repository.findById(
      context.organisationId,
      workOrderId,
    );
    if (!existing) {
      throw new NotFoundException('Resource not found');
    }

    if (existing.status === 'COMPLETED' || existing.status === 'CANCELLED') {
      throw new ConflictException(
        `Cannot edit work order that is already ${existing.status.toLowerCase()}`,
      );
    }

    const updated = await this.repository.update(
      context.organisationId,
      workOrderId,
      {
        title: input.title ? input.title.trim() : undefined,
        description: input.description ? input.description.trim() : undefined,
        priority: input.priority,
        siteName: input.siteName ? input.siteName.trim() : undefined,
      },
    );
    if (!updated) {
      throw new NotFoundException('Resource not found');
    }
    return updated;
  }

  async assign(
    context: TenantContext,
    workOrderId: string,
    input: AssignWorkOrderInput,
  ): Promise<WorkOrderSummary> {
    const existing = await this.repository.findById(
      context.organisationId,
      workOrderId,
    );
    if (!existing) {
      throw new NotFoundException('Resource not found');
    }

    if (existing.status === 'IN_PROGRESS' || existing.status === 'COMPLETED') {
      throw new ConflictException(
        `Cannot reschedule or reassign work order that is ${existing.status.toLowerCase()}`,
      );
    }

    if (input.scheduledStart >= input.scheduledEnd) {
      throw new BadRequestException(
        'Scheduled start time must precede scheduled end time',
      );
    }

    const minAllowed = new Date(Date.now() - 5 * 60 * 1000);
    if (input.scheduledStart < minAllowed) {
      throw new BadRequestException('Scheduled start time cannot be in the past');
    }

    await this.validateTechnician(context, input.assignedTechnicianId);

    const updated = await this.repository.updateAssignment(
      context.organisationId,
      workOrderId,
      input,
    );
    if (!updated) {
      throw new NotFoundException('Resource not found');
    }
    return updated;
  }

  async updateStatus(
    context: TenantContext,
    workOrderId: string,
    input: UpdateWorkOrderStatusInput,
    userRole: string,
    userId: string,
  ): Promise<WorkOrderSummary> {
    const existing = await this.repository.findById(
      context.organisationId,
      workOrderId,
    );
    if (!existing) {
      throw new NotFoundException('Resource not found');
    }

    // Role-based status transition checks:
    // Technicians can only transition assigned work to IN_PROGRESS or COMPLETED
    if (userRole === 'TECHNICIAN') {
      if (existing.assignedTechnicianId !== userId) {
        throw new NotFoundException('Resource not found');
      }
      if (input.status !== 'IN_PROGRESS' && input.status !== 'COMPLETED') {
        throw new ForbiddenException(
          'Technicians may only update status to in_progress or completed',
        );
      }
    }

    const allowed = PERMITTED_TRANSITIONS[existing.status];
    if (!allowed.includes(input.status)) {
      throw new ConflictException(
        `Invalid status transition from ${existing.status} to ${input.status}`,
      );
    }

    const updated = await this.repository.updateStatus(
      context.organisationId,
      workOrderId,
      input,
    );
    if (!updated) {
      throw new NotFoundException('Resource not found');
    }
    return updated;
  }

  private async validateTechnician(
    context: TenantContext,
    technicianId: string,
  ): Promise<void> {
    let user;
    try {
      user = await this.users.getById(context, technicianId);
    } catch {
      throw new NotFoundException(
        'Assigned technician not found in organisation',
      );
    }
    if (user.role !== 'TECHNICIAN') {
      throw new BadRequestException(
        'Assigned user must have the technician role',
      );
    }
  }
}
