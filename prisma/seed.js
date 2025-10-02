// prisma/seed.js (CommonJS)
const { PrismaClient } = require('@prisma/client');
const { randomUUID } = require('crypto');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Toklytics – Battles...');

  // USERS
  const admin = await prisma.users.upsert({
    where: { email: 'admin@toklytics.net' },
    update: {},
    create: {
      id: randomUUID(),
      email: 'admin@toklytics.net',
      handle: 'beaAdmin',
      role: 'ADMIN',
    },
  });

  const creatorUser = await prisma.users.upsert({
    where: { email: 'creator1@example.com' },
    update: {},
    create: {
      id: randomUUID(),
      email: 'creator1@example.com',
      handle: 'creator1',
      role: 'CREATOR',
    },
  });

  const viewerUser = await prisma.users.upsert({
    where: { email: 'viewer1@example.com' },
    update: {},
    create: {
      id: randomUUID(),
      email: 'viewer1@example.com',
      handle: 'viewer1',
      role: 'VIEWER',
    },
  });

  // CREATOR / VIEWER profiles
  const creator = await prisma.creators.upsert({
    where: { user_id: creatorUser.id },
    update: {},
    create: {
      id: randomUUID(),
      user_id: creatorUser.id,
      display_name: 'Creator One',
      backstage_verified: true,
    },
  });

  const viewer = await prisma.viewers.upsert({
    where: { user_id: viewerUser.id },
    update: {},
    create: {
      id: randomUUID(),
      user_id: viewerUser.id,
      display_name: 'Viewer One',
    },
  });

  // BATTLE
  const battle = await prisma.battles.create({
    data: {
      id: randomUUID(),
      creator_id: creator.id,
      scheduled_at: new Date(Date.now() + 60 * 60 * 1000), // +1h
      title: 'Test Battle',
      notes: 'Seeded battle for demo',
    },
  });

  // BOOSTER + EVENT
  const booster = await prisma.boosters.create({
    data: {
      id: randomUUID(),
      type: 'MULTIPLIER',
      holder_viewer_id: viewer.id,
      creator_id: creator.id,
      awarded_at: new Date(),
      expiry_at: new Date(Date.now() + 30 * 60 * 1000), // +30m
      source: 'match_win',
      active: true,
    },
  });

  await prisma.booster_events.create({
    data: {
      id: randomUUID(),
      booster_id: booster.id,
      kind: 'CREATED',
      at: new Date(),
      meta: { note: 'seed' },
    },
  });

  console.log('✅ Seed done.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
