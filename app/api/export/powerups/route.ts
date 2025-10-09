import { NextResponse } from 'next/server'
import { Role, type PrismaClient } from '@prisma/client'
import { getPrismaClient, MissingDatabaseUrlError } from '@/src/lib/prisma'
import { getViewerContext } from '@/src/lib/viewer-context'
import { resolveSubscriptionPlan, hasProAccess } from '@/src/lib/billing'

const LABELS: Record<string, string> = {
  MAGIC_MIST: 'Magic Mist',
  VAULT_GLOVE: 'Vault Glove',
  NO2_BOOSTER: 'No. 2 Booster',
  NO3_BOOSTER: 'No. 3 Booster',
  STUN_HAMMER: 'Stun Hammer',
  GLOVE: 'Boosting Glove',
  TIME_MAKER: 'Time Maker',
}

export async function GET(req: Request) {
  const context = await getViewerContext(req.headers)
  if (!context) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let prisma: PrismaClient
  try {
    prisma = getPrismaClient()
  } catch (error) {
    if (error instanceof MissingDatabaseUrlError) {
      return NextResponse.json({ error: 'Database connection not configured' }, { status: 503 })
    }
    throw error
  }

  const plan = await resolveSubscriptionPlan(prisma, context)
  if (!hasProAccess(plan)) {
    return NextResponse.json({ error: 'Export is Pro+ only' }, { status: 403 })
  }

  const creatorFilter = context.role === Role.ADMIN ? undefined : context.accessibleCreatorIds

  const powerups = await prisma.powerups.findMany({
    where: {
      active: true,
      ...(creatorFilter ? { creator_id: { in: creatorFilter } } : {}),
    },
    orderBy: { expiry_at: 'asc' },
    take: 500,
    include: {
      holder: { select: { display_name: true } },
      creator: { select: { display_name: true } },
    },
  })

  const rows = [
    ['id','type','type_label','creator_id','creator_name','holder_viewer_id','holder_name','awarded_at','expiry_at','source','active'],
    ...powerups.map(p => [
      p.id,
      p.type,
      LABELS[p.type] ?? p.type,
      p.creator_id,
      p.creator?.display_name ?? '',
      p.holder_viewer_id,
      p.holder?.display_name ?? '',
      p.awarded_at.toISOString(),
      p.expiry_at.toISOString(),
      p.source,
      String(p.active),
    ]),
  ]

  const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\r\n')

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename=powerups.csv',
    },
  })
}
