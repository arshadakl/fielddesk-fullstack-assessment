import { Injectable } from '@nestjs/common';

import type { TenantContext } from '../../../common/interfaces/tenant-context.interface';
import { PrismaService } from '../../../database/prisma.service';
import type { OrganisationRepositoryPort } from '../interfaces/organisation-repository.interface';
import type { OrganisationSummary } from '../interfaces/organisation.interface';

@Injectable()
export class OrganisationRepository implements OrganisationRepositoryPort {
  constructor(private readonly database: PrismaService) {}

  findCurrent(context: TenantContext): Promise<OrganisationSummary | null> {
    return this.database.client.organisation.findUnique({
      where: { id: context.organisationId },
      select: { id: true, name: true },
    });
  }
}
