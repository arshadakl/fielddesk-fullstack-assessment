import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import {
  CurrentIdentity,
  RequirePermission,
} from '../../http/decorators/auth.decorators';
import type { Identity } from '../../modules/auth/interfaces/auth-identity.interface';
import { WorkOrderService } from '../../modules/work-order/services/work-order.service';
import { AssignWorkOrderDto } from './dtos/assign-work-order.dto';
import { CreateWorkOrderDto } from './dtos/create-work-order.dto';
import { ListWorkOrdersQueryDto } from './dtos/list-work-orders-query.dto';
import { UpdateWorkOrderStatusDto } from './dtos/update-work-order-status.dto';
import { UpdateWorkOrderDto } from './dtos/update-work-order.dto';
import { WorkOrderListResDto } from './dtos/work-order-list-res.dto';
import { WorkOrderResDto } from './dtos/work-order-res.dto';

@ApiTags('Work Orders')
@ApiCookieAuth('session')
@Controller('api/v1/work-orders')
export class WorkOrdersController {
  constructor(private readonly workOrders: WorkOrderService) {}

  @Get()
  @ApiOperation({ summary: 'List work orders with role-aware scoping' })
  @ApiResponse({ status: 200, type: WorkOrderListResDto })
  async list(
    @CurrentIdentity() identity: Identity,
    @Query() query: ListWorkOrdersQueryDto,
  ): Promise<WorkOrderListResDto> {
    const context = { organisationId: identity.organisation.id };
    const result = await this.workOrders.list(
      context,
      {
        status: query.status,
        priority: query.priority,
        assignedTechnicianId: query.assignedTechnicianId,
        search: query.search,
      },
      { page: query.page, limit: query.limit },
      identity.role,
      identity.id,
    );
    return WorkOrderListResDto.fromData(result);
  }

  @Post()
  @RequirePermission('work:manage')
  @ApiOperation({ summary: 'Create a new work order' })
  @ApiResponse({ status: 201, type: WorkOrderResDto })
  async create(
    @CurrentIdentity() identity: Identity,
    @Body() dto: CreateWorkOrderDto,
  ): Promise<WorkOrderResDto> {
    const context = { organisationId: identity.organisation.id };
    const result = await this.workOrders.create(context, identity.id, {
      title: dto.title,
      description: dto.description,
      priority: dto.priority,
      siteName: dto.siteName,
      assignedTechnicianId: dto.assignedTechnicianId,
      scheduledStart: dto.scheduledStart,
      scheduledEnd: dto.scheduledEnd,
    });
    return WorkOrderResDto.fromData(result);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get work order details' })
  @ApiResponse({ status: 200, type: WorkOrderResDto })
  async getById(
    @CurrentIdentity() identity: Identity,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<WorkOrderResDto> {
    const context = { organisationId: identity.organisation.id };
    const result = await this.workOrders.getById(
      context,
      id,
      identity.role,
      identity.id,
    );
    return WorkOrderResDto.fromData(result);
  }

  @Patch(':id')
  @RequirePermission('work:manage')
  @ApiOperation({ summary: 'Update work order details' })
  @ApiResponse({ status: 200, type: WorkOrderResDto })
  async update(
    @CurrentIdentity() identity: Identity,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateWorkOrderDto,
  ): Promise<WorkOrderResDto> {
    const context = { organisationId: identity.organisation.id };
    const result = await this.workOrders.update(context, id, {
      title: dto.title,
      description: dto.description,
      priority: dto.priority,
      siteName: dto.siteName,
    });
    return WorkOrderResDto.fromData(result);
  }

  @Post(':id/assign')
  @RequirePermission('work:manage')
  @ApiOperation({
    summary: 'Assign technician and schedule window with concurrency overlap protection',
  })
  @ApiResponse({ status: 200, type: WorkOrderResDto })
  async assign(
    @CurrentIdentity() identity: Identity,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignWorkOrderDto,
  ): Promise<WorkOrderResDto> {
    const context = { organisationId: identity.organisation.id };
    const result = await this.workOrders.assign(context, id, {
      assignedTechnicianId: dto.assignedTechnicianId,
      scheduledStart: dto.scheduledStart,
      scheduledEnd: dto.scheduledEnd,
    });
    return WorkOrderResDto.fromData(result);
  }

  @Post(':id/status')
  @ApiOperation({ summary: 'Update work order status' })
  @ApiResponse({ status: 200, type: WorkOrderResDto })
  async updateStatus(
    @CurrentIdentity() identity: Identity,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateWorkOrderStatusDto,
  ): Promise<WorkOrderResDto> {
    const context = { organisationId: identity.organisation.id };
    const result = await this.workOrders.updateStatus(
      context,
      id,
      { status: dto.status },
      identity.role,
      identity.id,
    );
    return WorkOrderResDto.fromData(result);
  }
}
