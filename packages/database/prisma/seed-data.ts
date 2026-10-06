import { hash, argon2id } from 'argon2';
import { PrismaClient, UserRole, normalizeEmail } from '../src';

// Development-only fixtures. Not built or exported by the public package.
export const SAMPLE_PASSWORD = 'FieldDeskDemo!2026';
export const seedOrganisations = [
  { slug: 'fielddesk-north', name: 'FieldDesk North' },
  { slug: 'fielddesk-south', name: 'FieldDesk South' },
];
const roles = [UserRole.OWNER, UserRole.DISPATCHER, UserRole.TECHNICIAN];

export async function seedDatabase(client: PrismaClient): Promise<void> {
  const passwordHash = await hash(SAMPLE_PASSWORD, {
    type: argon2id,
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
  });
  await client.$transaction(async (transaction) => {
    for (const fixture of seedOrganisations) {
      const organisation = await transaction.organisation.upsert({
        where: { slug: fixture.slug },
        update: {},
        create: fixture,
      });
      const region = fixture.slug.replace('fielddesk-', '');
      for (const role of roles) {
        const email = normalizeEmail(
          `${role.toLowerCase()}.${region}@fielddesk.example`,
        );
        await transaction.user.upsert({
          where: { email },
          update: {},
          create: {
            email,
            name: `${region} ${role.toLowerCase()}`,
            passwordHash,
            role,
            organisationId: organisation.id,
          },
        });
      }
    }
  });
}
