import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { TestingModule } from '@nestjs/testing';

import { UserService } from '../../user/services/user.service';
import { WORK_ORDER_REPOSITORY } from '../interfaces/work-order-repository.interface';
import type { WorkOrderRepositoryPort } from '../interfaces/work-order-repository.interface';
import type { WorkOrderSummary } from '../interfaces/work-order.interface';
import { WorkOrderService } from './work-order.service';

describe('WorkOrderService', () => {
  let findWorkOrderByIdMock: jest.Mock;
  let listByOrganisationMock: jest.Mock;
  let countByOrganisationMock: jest.Mock;
  let createWorkOrderMock: jest.Mock;
  let updateWorkOrderMock: jest.Mock;
  let updateAssignmentMock: jest.Mock;
  let updateStatusMock: jest.Mock;

  let getUserByIdMock: jest.Mock;

  let workOrderRepo: WorkOrderRepositoryPort;
  let userService: Partial<UserService>;
  let module: TestingModule;
  let service: WorkOrderService;

  const tenant = { organisationId: '11111111-1111-1111-1111-111111111111' };
  const mockWorkOrder: WorkOrderSummary = {
    id: 'wo-1',
    organisationId: tenant.organisationId,
    reference: 'WO-0001',
    title: 'AC Fix',
    description: 'Leaking water',
    priority: 'MEDIUM',
    status: 'DRAFT',
    siteName: 'Site 1',
    creatorId: 'user-1',
    creatorName: 'Arjun',
    assignedTechnicianId: null,
    assignedTechnicianName: null,
    scheduledStart: null,
    scheduledEnd: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    findWorkOrderByIdMock = jest.fn();
    listByOrganisationMock = jest.fn();
    countByOrganisationMock = jest.fn();
    createWorkOrderMock = jest.fn();
    updateWorkOrderMock = jest.fn();
    updateAssignmentMock = jest.fn();
    updateStatusMock = jest.fn();

    getUserByIdMock = jest.fn();

    workOrderRepo = {
      findById: findWorkOrderByIdMock,
      listByOrganisation: listByOrganisationMock,
      countByOrganisation: countByOrganisationMock,
      create: createWorkOrderMock,
      update: updateWorkOrderMock,
      updateAssignment: updateAssignmentMock,
      updateStatus: updateStatusMock,
    };

    userService = {
      getById: getUserByIdMock,
    };

    module = await Test.createTestingModule({
      providers: [
        WorkOrderService,
        { provide: WORK_ORDER_REPOSITORY, useValue: workOrderRepo },
        { provide: UserService, useValue: userService },
      ],
    }).compile();

    service = module.get(WorkOrderService);
  });

  afterEach(async () => {
    await module.close();
  });

  describe('Technician Scope Boundary', () => {
    it('restricts technician listing to only their assigned work', async () => {
      listByOrganisationMock.mockResolvedValue({
        items: [mockWorkOrder],
        total: 1,
        page: 1,
        limit: 20,
      });

      await service.list(
        tenant,
        {},
        { page: 1, limit: 20 },
        'TECHNICIAN',
        'tech-id-123',
      );

      expect(listByOrganisationMock).toHaveBeenCalledWith(
        tenant.organisationId,
        expect.objectContaining({ assignedTechnicianId: 'tech-id-123' }),
        { page: 1, limit: 20 },
      );
    });

    it('rejects technician viewing another technician work order with 404', async () => {
      findWorkOrderByIdMock.mockResolvedValue({
        ...mockWorkOrder,
        assignedTechnicianId: 'other-tech-id',
      });

      await expect(
        service.getById(tenant, 'wo-1', 'TECHNICIAN', 'my-tech-id'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('Scheduling & Assignment', () => {
    it('rejects scheduling window when start is after end', async () => {
      findWorkOrderByIdMock.mockResolvedValue(mockWorkOrder);

      const start = new Date('2026-10-10T12:00:00Z');
      const end = new Date('2026-10-10T11:00:00Z');

      await expect(
        service.assign(tenant, 'wo-1', {
          assignedTechnicianId: 'tech-1',
          scheduledStart: start,
          scheduledEnd: end,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects assignment if target user is not a technician', async () => {
      findWorkOrderByIdMock.mockResolvedValue(mockWorkOrder);
      getUserByIdMock.mockResolvedValue({
        id: 'user-dispatcher',
        organisationId: tenant.organisationId,
        email: 'disp@test.com',
        name: 'Meera',
        role: 'DISPATCHER',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const start = new Date('2026-10-10T10:00:00Z');
      const end = new Date('2026-10-10T12:00:00Z');

      await expect(
        service.assign(tenant, 'wo-1', {
          assignedTechnicianId: 'user-dispatcher',
          scheduledStart: start,
          scheduledEnd: end,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects rescheduling if work order is already IN_PROGRESS', async () => {
      findWorkOrderByIdMock.mockResolvedValue({
        ...mockWorkOrder,
        status: 'IN_PROGRESS',
      });

      const start = new Date('2026-10-10T10:00:00Z');
      const end = new Date('2026-10-10T12:00:00Z');

      await expect(
        service.assign(tenant, 'wo-1', {
          assignedTechnicianId: 'tech-1',
          scheduledStart: start,
          scheduledEnd: end,
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('rejects create when scheduled start is after or equal to end', async () => {
      const start = new Date('2026-10-10T12:00:00Z');
      const end = new Date('2026-10-10T11:00:00Z');

      await expect(
        service.create(tenant, 'creator-1', {
          title: 'Test WO',
          description: 'Test Desc',
          siteName: 'Site A',
          scheduledStart: start,
          scheduledEnd: end,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects create when only scheduled start is provided', async () => {
      const start = new Date('2026-10-10T12:00:00Z');

      await expect(
        service.create(tenant, 'creator-1', {
          title: 'Test WO',
          description: 'Test Desc',
          siteName: 'Site A',
          scheduledStart: start,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('allows create when valid scheduled window is provided without technician', async () => {
      createWorkOrderMock.mockResolvedValue(mockWorkOrder);
      const start = new Date('2026-10-10T10:00:00Z');
      const end = new Date('2026-10-10T12:00:00Z');

      const result = await service.create(tenant, 'creator-1', {
        title: 'Test WO',
        description: 'Test Desc',
        siteName: 'Site A',
        scheduledStart: start,
        scheduledEnd: end,
      });

      expect(result).toBeDefined();
      expect(createWorkOrderMock).toHaveBeenCalled();
    });
  });

  describe('Status Transitions', () => {
    it('prevents invalid transition from DRAFT directly to COMPLETED', async () => {
      findWorkOrderByIdMock.mockResolvedValue(mockWorkOrder);

      await expect(
        service.updateStatus(
          tenant,
          'wo-1',
          { status: 'COMPLETED' },
          'OWNER',
          'owner-1',
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('forbids technician from cancelling a work order', async () => {
      findWorkOrderByIdMock.mockResolvedValue({
        ...mockWorkOrder,
        status: 'SCHEDULED',
        assignedTechnicianId: 'tech-1',
      });

      await expect(
        service.updateStatus(
          tenant,
          'wo-1',
          { status: 'CANCELLED' },
          'TECHNICIAN',
          'tech-1',
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('allows assigned technician to progress from SCHEDULED to IN_PROGRESS', async () => {
      findWorkOrderByIdMock.mockResolvedValue({
        ...mockWorkOrder,
        status: 'SCHEDULED',
        assignedTechnicianId: 'tech-1',
      });
      updateStatusMock.mockResolvedValue({
        ...mockWorkOrder,
        status: 'IN_PROGRESS',
        assignedTechnicianId: 'tech-1',
      });

      const result = await service.updateStatus(
        tenant,
        'wo-1',
        { status: 'IN_PROGRESS' },
        'TECHNICIAN',
        'tech-1',
      );

      expect(result.status).toBe('IN_PROGRESS');
      expect(updateStatusMock).toHaveBeenCalledWith(
        tenant.organisationId,
        'wo-1',
        { status: 'IN_PROGRESS' },
      );
    });
  });
});
