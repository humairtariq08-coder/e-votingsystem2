const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const db = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create Demo Admin User
  const passwordHash = await bcrypt.hash('admin123', 10);
  const user = await db.user.upsert({
    where: { email: 'admin@aegisvote.org' },
    update: {},
    create: {
      email: 'admin@aegisvote.org',
      name: 'Chief Election Admin',
      passwordHash,
      role: 'PLATFORM_ADMIN',
    },
  });

  console.log('Created User:', user.email);

  // Create Demo Organization
  const org = await db.organization.upsert({
    where: { slug: 'election-commission-pakistan' },
    update: {},
    create: {
      name: 'Election Commission of Pakistan',
      slug: 'election-commission-pakistan',
      description: 'Federal Independent Constitutional Authority for Sovereign Elections',
      tier: 'GOVERNMENT',
      isVerified: true,
      website: 'https://ecp.gov.pk',
      members: {
        create: {
          userId: user.id,
          role: 'OWNER',
        },
      },
    },
  });

  console.log('Created Organization:', org.name);

  // Create Demo Election
  const electionCount = await db.election.count({ where: { organizationId: org.id } });

  if (electionCount === 0) {
    const election = await db.election.create({
      data: {
        organizationId: org.id,
        title: '2026 Sovereign National Election',
        description:
          'Official nationwide election for legislative representatives. Features Zero-Knowledge cryptographic verification and WebAuthn biometric security.',
        type: 'CANDIDATE_SELECTION',
        visibility: 'PUBLIC',
        requireBiometric: true,
        status: 'ACTIVE',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        options: {
          create: [
            {
              name: 'Dr. Sarah Al-Mansoor',
              party: 'Progressive Alliance Party',
              bio: 'Economist & Renewable Infrastructure Advocate with 15 years in public service.',
              type: 'CANDIDATE',
              sortOrder: 0,
            },
            {
              name: 'Tariq Mehmood',
              party: 'National Democratic Front',
              bio: 'Former Technology Minister promoting AI education and digital sovereignty.',
              type: 'CANDIDATE',
              sortOrder: 1,
            },
            {
              name: 'Aisha Rahman',
              party: 'Green Future Initiative',
              bio: 'Environmental Law Expert focusing on climate resilience & clean energy.',
              type: 'CANDIDATE',
              sortOrder: 2,
            },
          ],
        },
      },
    });

    console.log('Created Demo Election:', election.title);
  }

  console.log('Database seeding complete!');
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
