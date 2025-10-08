import { NotificationChannel, NotificationKind, NotificationStatus, PowerUpEventKind, Prisma } from '@prisma/client'
import { prisma } from '../lib/prisma'

async function expirePowerups() {
  const now = new Date()
  const stale = await prisma.powerups.findMany({
    where: { active: true, expiry_at: { lte: now } },
    select: { id: true },
  })

  if (stale.length === 0) {
    return { expired: 0 }
  }

  const ids = stale.map(p => p.id)

  await prisma.$transaction([
    prisma.powerups.updateMany({
      where: { id: { in: ids } },
      data: { active: false },
    }),
    prisma.powerup_events.createMany({
      data: ids.map(id => ({
        powerup_id: id,
        kind: PowerUpEventKind.EXPIRED,
        at: now,
      })),
      skipDuplicates: true,
    }),
  ])

  return { expired: ids.length }
}

async function queueExpiryNotifications() {
  const now = new Date()
  const threshold = new Date(now.getTime() + 24 * 60 * 60 * 1000)

  const expiring = await prisma.powerups.findMany({
    where: { active: true, expiry_at: { lte: threshold } },
    select: {
      id: true,
      type: true,
      expiry_at: true,
      creator_id: true,
      creator: { select: { user_id: true, display_name: true } },
    },
  })

  const byUser = new Map<
    string,
    {
      creatorId: string
      creatorName: string
      powerups: { id: string; type: string; expiry_at: Date }[]
    }
  >()

  for (const pu of expiring) {
    const userId = pu.creator?.user_id
    if (!userId) continue
    const entry = byUser.get(userId) ?? {
      creatorId: pu.creator_id,
      creatorName: pu.creator.display_name ?? pu.creator_id,
      powerups: [],
    }
    entry.powerups.push({ id: pu.id, type: pu.type, expiry_at: pu.expiry_at })
    byUser.set(userId, entry)
  }

  if (byUser.size === 0) {
    return { queued: 0 }
  }

  const userIds = [...byUser.keys()]
  const existing = await prisma.notifications.findMany({
    where: {
      user_id: { in: userIds },
      kind: NotificationKind.PowerUp_EXPIRING,
      status: NotificationStatus.PENDING,
      send_at: { gte: new Date(now.getTime() - 4 * 60 * 60 * 1000) }, // skip if already queued recently
    },
    select: { user_id: true },
  })
  const skipUsers = new Set(existing.map(n => n.user_id))

  const payloads: {
    user_id: string
    channel: NotificationChannel
    kind: NotificationKind
    payload: Record<string, unknown>
    send_at: Date
    status: NotificationStatus
  }[] = []
  for (const [userId, entry] of byUser) {
    if (skipUsers.has(userId)) continue
    payloads.push({
      user_id: userId,
      channel: NotificationChannel.IN_APP,
      kind: NotificationKind.PowerUp_EXPIRING,
      payload: {
        creatorId: entry.creatorId,
        creatorName: entry.creatorName,
        expiringPowerups: entry.powerups
          .sort((a, b) => +a.expiry_at - +b.expiry_at)
          .map(item => ({
            id: item.id,
            type: item.type,
            expiresAt: item.expiry_at.toISOString(),
          })),
        expiresBefore: threshold.toISOString(),
      },
      send_at: now,
      status: NotificationStatus.PENDING,
    })
  }

  if (payloads.length === 0) {
    return { queued: 0 }
  }

  await prisma.notifications.createMany({
    data: payloads.map(p => ({
      ...p,
      payload: p.payload as Prisma.InputJsonValue,
    })),
  })

  return { queued: payloads.length }
}

async function main() {
  console.log('⏱️  Toklytics cron start')

  const results = await expirePowerups()
  console.log(`• Power-ups expired: ${results.expired}`)

  const notifications = await queueExpiryNotifications()
  console.log(`• Expiry notifications queued: ${notifications.queued}`)

  console.log('✅ Cron complete')
}

main()
  .then(async () => {
    await prisma.$disconnect()
    process.exit(0)
  })
  .catch(async (err) => {
    console.error('❌ Cron failed', err)
    await prisma.$disconnect()
    process.exit(1)
  })
