import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Clean existing data
  await prisma.signal.deleteMany();
  await prisma.user.deleteMany();

  // Create sample users
  const alex = await prisma.user.create({
    data: {
      email: 'alex@citysignal.local',
      name: 'Alex Rivera',
      role: 'CITIZEN',
    },
  });

  const admin = await prisma.user.create({
    data: {
      email: 'admin@citysignal.local',
      name: 'City Admin',
      role: 'ADMIN',
    },
  });

  // Create sample signals
  await prisma.signal.createMany({
    data: [
      {
        title: 'Broken Streetlight on 5th Ave',
        description: 'The streetlight near 5th Ave & Pine St has been flickering and is now dark.',
        status: 'OPEN',
        latitude: 40.7128,
        longitude: -74.006,
        authorId: alex.id,
      },
      {
        title: 'Pothole near Main Market',
        description: 'Large pothole causing traffic slowdown near the main market entrance.',
        status: 'IN_PROGRESS',
        latitude: 40.7135,
        longitude: -74.0045,
        authorId: alex.id,
      },
    ],
  });

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
