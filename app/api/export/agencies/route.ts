import { NextResponse } from 'next/server'
import { Role, type PrismaClient } from '@prisma/client'
import { getPrismaClient, MissingDatabaseUrlError } from '@/src/lib/prisma'
import { getViewerContext } from '@/src/lib/viewer-context'

const DAY_MS = 24 * 60 * 60 * 1000

function allowExport() {
  const plan = process.env.BILLING_DEMO_PLAN ?? 'STARTER'
  return plan === 'PRO' || plan === 'AGENCY'
}

export async function GET(req: Request) {
  if (!allowExport()) {
    return NextResponse.json({ error: 'Export is Pro+ only' }, { status: 403 })
  }

  const context = await getViewerContext(req.headers)
  if (!context) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (context.role === Role.CREATOR) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
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

  const agencyWhere = 'agencyId' in context ? { id: context.agencyId } : undefined

  const agencies = await prisma.agencies.findMany({
    where: agencyWhere,
    include: {
      memberships: {
        where: { active: true },
        include: {
          creator: {
            select: {
              id: true,
              display_name: true,
              powerups: {
                where: { active: true },
                orderBy: { expiry_at: 'asc' },
                select: { id: true, type: true, expiry_at: true },
              },
            },
          },
        },
      },
    },
  })

  const now = Date.now()

  const rows = [
    [
      'agency_id',
      'agency_name',
      'creator_id',
      'creator_name',
      'active_powerups',
      'expiring_24h',
      'expiring_72h',
    ],
  ]

  for (const agency of agencies) {
    const creators = agency.memberships.flatMap(m => (m.creator ? [m.creator] : []))
    for (const creator of creators) {
      const total = creator.powerups.length
      const exp24 = creator.powerups.filter(p => new Date(p.expiry_at).getTime() <= now + DAY_MS).length
      const exp72 = creator.powerups.filter(p => new Date(p.expiry_at).getTime() <= now + 3 * DAY_MS).length
      rows.push([
        agency.id,
        agency.name,
        creator.id,
        creator.display_name,
        String(total),
        String(exp24),
        String(exp72),
      ])
    }
  }

  const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\r\n')

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename=agency-powerups.csv',
    },
  })
}
