import { Module } from '@nestjs/common';

import { WorkOrderModule } from '../../modules/work-order/work-order.module';
import { WorkOrdersController } from './work-orders.controller';

@Module({
  imports: [WorkOrderModule],
  controllers: [WorkOrdersController],
})
export class WorkOrdersRoutesModule {}
