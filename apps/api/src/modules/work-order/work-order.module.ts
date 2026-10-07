import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../database/database.module';
import { UserModule } from '../user/user.module';
import { WORK_ORDER_REPOSITORY } from './interfaces/work-order-repository.interface';
import { WorkOrderRepository } from './repositories/work-order.repository';
import { WorkOrderService } from './services/work-order.service';

@Module({
  imports: [DatabaseModule, UserModule],
  providers: [
    { provide: WORK_ORDER_REPOSITORY, useClass: WorkOrderRepository },
    WorkOrderService,
  ],
  exports: [WorkOrderService],
})
export class WorkOrderModule {}
