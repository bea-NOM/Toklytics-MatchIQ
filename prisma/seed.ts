// prisma/seed.ts
import { PrismaClient, Prisma, Role, PowerUpType, PowerUpEventKind } from '@prisma/client'

const prisma = new PrismaClient()

const addMinutes = (date: Date, minutes: number) => new Date(date.getTime() + minutes * 60_000)

async function main() {
  console.log('🌱 Seeding Toklytics Battles data...')

  // Clean out previous seed artifacts so the script stays idempotent for dev runs.
  await prisma.powerup_events.deleteMany({ where: { powerup: { source: 'seed-script' } } })
  await prisma.powerups.deleteMany({ where: { source: 'seed-script' } })
  await prisma.battles.deleteMany({ where: { notes: 'Seeded battle for demo' } })
  await prisma.powerupEvent.deleteMany({ where: { matchId: { in: ['demo-match-1', 'demo-match-2'] } } })

  // Core actors
  const admin = await prisma.users.upsert({
    where: { email: 'admin@toklytics.net' },
    update: { handle: 'beaAdmin', role: Role.ADMIN },
    create: { email: 'admin@toklytics.net', handle: 'beaAdmin', role: Role.ADMIN },
  })

  const creatorUser = await prisma.users.upsert({
    where: { email: 'creator1@example.com' },
    update: { handle: 'creator1', role: Role.CREATOR },
    create: { email: 'creator1@example.com', handle: 'creator1', role: Role.CREATOR },
  })

  const viewerUserA = await prisma.users.upsert({
    where: { email: 'viewer1@example.com' },
    update: { handle: 'viewer1', role: Role.VIEWER },
    create: { email: 'viewer1@example.com', handle: 'viewer1', role: Role.VIEWER },
  })

  const viewerUserB = await prisma.users.upsert({
    where: { email: 'viewer2@example.com' },
    update: { handle: 'viewer2', role: Role.VIEWER },
    create: { email: 'viewer2@example.com', handle: 'viewer2', role: Role.VIEWER },
  })

  const creator = await prisma.creators.upsert({
    where: { user_id: creatorUser.id },
    update: { display_name: 'Creator One', backstage_verified: true },
    create: { user_id: creatorUser.id, display_name: 'Creator One', backstage_verified: true },
  })

  const viewerA = await prisma.viewers.upsert({
    where: { user_id: viewerUserA.id },
    update: { display_name: 'Viewer One' },
    create: { user_id: viewerUserA.id, display_name: 'Viewer One' },
  })

  const viewerB = await prisma.viewers.upsert({
    where: { user_id: viewerUserB.id },
    update: { display_name: 'Viewer Two' },
    create: { user_id: viewerUserB.id, display_name: 'Viewer Two' },
  })

  const now = new Date()

  const battle = await prisma.battles.create({
    data: {
      creator_id: creator.id,
      scheduled_at: addMinutes(now, 90),
      title: 'Creator One vs Community',
      notes: 'Seeded battle for demo',
    },
  })

  const [glove, timeMaker] = await Promise.all([
    prisma.powerups.create({
      data: {
        type: PowerUpType.GLOVE,
        holder_viewer_id: viewerA.id,
        creator_id: creator.id,
        awarded_at: addMinutes(now, -25),
        expiry_at: addMinutes(now, 35),
        source: 'seed-script',
        active: true,
      },
    }),
    prisma.powerups.create({
      data: {
        type: PowerUpType.TIME_MAKER,
        holder_viewer_id: viewerB.id,
        creator_id: creator.id,
        awarded_at: addMinutes(now, -10),
        expiry_at: addMinutes(now, 20),
        source: 'seed-script',
        active: true,
      },
    }),
  ])

  await prisma.powerup_events.createMany({
    data: [
      {
        powerup_id: glove.id,
        kind: PowerUpEventKind.CREATED,
        at: addMinutes(now, -25),
        meta: { reason: 'awarded for top supporter' } as Prisma.JsonObject,
      },
      {
        powerup_id: glove.id,
        kind: PowerUpEventKind.ACTIVATED,
        at: addMinutes(now, -5),
        meta: { trigger: 'viewer_manual' } as Prisma.JsonObject,
      },
      {
        powerup_id: timeMaker.id,
        kind: PowerUpEventKind.CREATED,
        at: addMinutes(now, -10),
        meta: { reason: 'daily reward' } as Prisma.JsonObject,
      },
    ],
  })

  await prisma.powerupEvent.createMany({
    data: [
      {
        matchId: 'demo-match-1',
        creatorId: creator.id,
        contributorId: viewerA.id,
        type: 'glove',
        action: 'used',
        ts: addMinutes(now, -3),
        expiresAt: addMinutes(now, 12),
      },
      {
        matchId: 'demo-match-1',
        creatorId: creator.id,
        contributorId: viewerB.id,
        type: 'time_maker',
        action: 'held',
        ts: addMinutes(now, -2),
        expiresAt: addMinutes(now, 18),
      },
      {
        matchId: 'demo-match-2',
        creatorId: creator.id,
        contributorId: admin.id,
        type: 'magic_mist',
        action: 'held',
        ts: addMinutes(now, -1),
        expiresAt: addMinutes(now, 25),
      },
    ],
  })

  console.log('✅ Seed completed')
  console.log(`   Battle created: ${battle.title}`)
  console.log(`   Power-ups active: ${[glove.type, timeMaker.type].join(', ')}`)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Seed failed:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
