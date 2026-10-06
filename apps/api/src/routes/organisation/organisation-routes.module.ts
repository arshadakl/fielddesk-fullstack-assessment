import { Module } from '@nestjs/common';

import { OrganisationModule } from '../../modules/organisation/organisation.module';
import { OrganisationController } from './organisation.controller';

@Module({
  imports: [OrganisationModule],
  controllers: [OrganisationController],
})
export class OrganisationRoutesModule {}
