import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiCookieAuth, ApiResponse } from '@nestjs/swagger';

import { OrganisationResDto } from '../../common/dtos/organisation-res.dto';
import { CurrentIdentity } from '../../http/decorators/auth.decorators';
import type { Identity } from '../../modules/auth/interfaces/auth-identity.interface';
import { OrganisationService } from '../../modules/organisation/services/organisation.service';

@ApiTags('Organisation')
@ApiCookieAuth('session')
@Controller('api/v1/organisation')
export class OrganisationController {
  constructor(private readonly organisations: OrganisationService) {}

  @Get()
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
}
