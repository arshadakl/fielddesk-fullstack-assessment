import { Body, Controller, Get, Patch } from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { OrganisationResDto } from '../../common/dtos/organisation-res.dto';
import {
  CurrentIdentity,
  RequirePermission,
} from '../../http/decorators/auth.decorators';
import type { Identity } from '../../modules/auth/interfaces/auth-identity.interface';
import { OrganisationService } from '../../modules/organisation/services/organisation.service';
import { UpdateOrganisationDto } from './dtos/update-organisation.dto';

@ApiTags('Organisation')
@ApiCookieAuth('session')
@Controller('api/v1/organisation')
export class OrganisationController {
  constructor(private readonly organisations: OrganisationService) {}

  @Get()
  @ApiOperation({ summary: 'Get current organisation summary' })
  @ApiResponse({ status: 200, type: OrganisationResDto })
  async get(
    @CurrentIdentity() identity: Identity,
  ): Promise<OrganisationResDto> {
    return OrganisationResDto.fromData(
      await this.organisations.getCurrent({
        organisationId: identity.organisation.id,
      }),
    );
  }

  @Patch()
  @RequirePermission('settings:manage')
  @ApiOperation({ summary: 'Update organisation settings' })
  @ApiResponse({ status: 200, type: OrganisationResDto })
  async update(
    @CurrentIdentity() identity: Identity,
    @Body() dto: UpdateOrganisationDto,
  ): Promise<OrganisationResDto> {
    const updated = await this.organisations.updateCurrent(
      { organisationId: identity.organisation.id },
      { name: dto.name },
    );
    return OrganisationResDto.fromData(updated);
  }
}
