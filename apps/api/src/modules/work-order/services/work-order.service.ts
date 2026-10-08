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
import { PrismaService } from '../../../database/prisma.service';
import type { NotificationRepositoryPort } from '../../notification/interfaces/notification.interface';
import { UserService } from '../../user/services/user.service';
import { WORK_ORDER_REPOSITORY } from '../interfaces/work-order-repository.interface';
import type { WorkOrderRepositoryPort } from '../interfaces/work-order-repository.interface';
import { WORK_ORDER_EVENT_REPOSITORY } from '../interfaces/work-order-event.interface';
import type {
  SubmitProgressEventInput,
  WorkOrderEventRepositoryPort,
  WorkOrderEventSummary,
} from '../interfaces/work-order-event.interface';
import type { WorkOrderEventRepository } from '../repositories/work-order-event.repository';
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
    @Inject(WORK_ORDER_EVENT_REPOSITORY)
    private readonly eventRepository: WorkOrderEventRepositoryPort &
      Pick<WorkOrderEventRepository, 'recordEventWithWorkOrderLock'>,
    @Inject('NotificationRepositoryPort')
    private readonly notificationRepository: NotificationRepositoryPort,
    private readonly prisma: PrismaService,
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
    if (
      userRole === 'TECHNICIAN' &&
      workOrder.assignedTechnicianId !== userId
    ) {
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
        throw new BadRequestException(
          'Scheduled start time cannot be in the past',
        );
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
      throw new BadRequestException(
        'Scheduled start time cannot be in the past',
      );
    }

    const technician = await this.validateTechnician(
      context,
      input.assignedTechnicianId,
    );

    // Atomically execute assignment and transactional outbox write
    // If the database transaction rolls back, zero notification records are ever published
    const updated = await this.prisma.client.$transaction(async (tx) => {
      const result = await this.repository.updateAssignment(
        context.organisationId,
        workOrderId,
        input,
        tx,
      );

      if (!result) {
        throw new NotFoundException('Resource not found');
      }

      // Generate deterministic idempotency key for this specific assignment version
      const idempotencyKey = `assign_${workOrderId}_${input.assignedTechnicianId}_${input.scheduledStart.getTime()}`;

      await this.notificationRepository.enqueueInTransaction(tx, {
        organisationId: context.organisationId,
        workOrderId,
        recipientId: input.assignedTechnicianId,
        channel: 'SMS',
        idempotencyKey,
        payload: {
          workOrderId,
          reference: existing.reference,
          title: existing.title,
          siteName: existing.siteName,
          technicianId: technician.id,
          technicianName: technician.name,
          scheduledStart: input.scheduledStart.toISOString(),
          scheduledEnd: input.scheduledEnd.toISOString(),
          assignedByUserId: existing.creatorId,
        },
      });

      return result;
    });

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
  ): Promise<{ id: string; name: string; role: string }> {
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
    return user;
  }

  async listEvents(
    context: TenantContext,
    workOrderId: string,
    userRole: string,
    userId: string,
  ): Promise<WorkOrderEventSummary[]> {
    // Check permission to view the work order first
    await this.getById(context, workOrderId, userRole, userId);
    return this.eventRepository.listByWorkOrderId(
      context.organisationId,
      workOrderId,
    );
  }

  async submitProgressEvent(
    context: TenantContext,
    workOrderId: string,
    input: SubmitProgressEventInput,
    userRole: string,
    userId: string,
  ): Promise<WorkOrderEventSummary> {
    // 1. Validate occurredAt timestamp sanity (cannot be > 5 minutes in future)
    const maxFutureAllowed = new Date(Date.now() + 5 * 60 * 1000);
    if (input.occurredAt.getTime() > maxFutureAllowed.getTime()) {
      throw new BadRequestException('Event timestamp cannot be in the future');
    }

    // 2. Early idempotency check: if eventId was already processed for this tenant, return it
    const existingEvent = await this.eventRepository.findByEventId(
      context.organisationId,
      input.eventId,
    );
    if (existingEvent) {
      if (existingEvent.workOrderId !== workOrderId) {
        throw new ConflictException(
          'Event ID already processed for another work order',
        );
      }
      return existingEvent;
    }

    // 3. Record event and execute status transition atomically under row lock
    try {
      return await this.eventRepository.recordEventWithWorkOrderLock(
        context.organisationId,
        workOrderId,
        userId,
        input,
        (lockedWorkOrder) => {
          // Verify occurredAt is not prior to work order creation (clock sanity)
          if (
            input.occurredAt.getTime() <
            lockedWorkOrder.createdAt.getTime() - 60 * 1000
          ) {
            throw new BadRequestException(
              'Event timestamp cannot precede work order creation',
            );
          }

          // Technicians can only submit progress events for work orders assigned to them
          if (
            userRole === 'TECHNICIAN' &&
            lockedWorkOrder.assignedTechnicianId !== userId
          ) {
            throw new NotFoundException('Resource not found');
          }

          // Determine if payload demands a status change
          const requestedStatusRaw = input.payload.status;
          if (
            typeof requestedStatusRaw !== 'string' ||
            requestedStatusRaw.trim().length === 0
          ) {
            return null;
          }

          const normalizedStatus =
            requestedStatusRaw.toUpperCase() as WorkOrderStatus;
          if (
            ![
              'DRAFT',
              'SCHEDULED',
              'IN_PROGRESS',
              'COMPLETED',
              'CANCELLED',
            ].includes(normalizedStatus)
          ) {
            throw new BadRequestException(
              `Unknown status: ${requestedStatusRaw}`,
            );
          }

          if (normalizedStatus === lockedWorkOrder.status) {
            return null;
          }

          // Enforce role-based restrictions on status update
          if (userRole === 'TECHNICIAN') {
            if (
              normalizedStatus !== 'IN_PROGRESS' &&
              normalizedStatus !== 'COMPLETED'
            ) {
              throw new ForbiddenException(
                'Technicians may only update status to IN_PROGRESS or COMPLETED',
              );
            }
          }

          const allowed = PERMITTED_TRANSITIONS[lockedWorkOrder.status];
          if (!allowed.includes(normalizedStatus)) {
            throw new ConflictException(
              `Invalid status transition from ${lockedWorkOrder.status} to ${normalizedStatus}`,
            );
          }

          return normalizedStatus;
        },
      );
    } catch (err: unknown) {
      if (err instanceof Error && err.message === 'WORK_ORDER_NOT_FOUND') {
        throw new NotFoundException('Resource not found');
      }
      throw err;
    }
  }
}
