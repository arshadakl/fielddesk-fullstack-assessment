import type { TenantContext } from '../../../common/interfaces/tenant-context.interface';
import type { OrganisationSummary } from './organisation.interface';

export const ORGANISATION_REPOSITORY = Symbol('ORGANISATION_REPOSITORY');
export interface OrganisationRepositoryPort {
  findCurrent(context: TenantContext): Promise<OrganisationSummary | null>;
}
