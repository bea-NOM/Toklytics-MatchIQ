import { NextResponse } from 'next/server'
import { getPrismaClient, MissingDatabaseUrlError } from '@/src/lib/prisma'
import { getViewerContext } from '@/src/lib/viewer-context'
import { Role } from '@prisma/client'

function toCsvRow(arr: any[]) {
  return arr.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')
}

export async function GET(req: Request) {
  const context = await getViewerContext(req.headers)
  if (!context) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let prisma
  try {
    prisma = getPrismaClient()
  } catch (err) {
    if (err instanceof MissingDatabaseUrlError) return NextResponse.json({ error: 'DB not configured' }, { status: 503 })
    throw err
  }

  const url = new URL(req.url)
  const params = Object.fromEntries(url.searchParams.entries())

  const where: any = {}
  if (context.role !== Role.ADMIN && context.accessibleCreatorIds) {
    where.creatorId = { in: context.accessibleCreatorIds }
  }
  if (params.creatorId) where.creatorId = params.creatorId
  if (params.contributorId) where.contributorId = params.contributorId
  if (params.type) where.type = params.type

  const rows = [['id','matchId','creatorId','contributorId','type','action','ts','expiresAt']]

  const events = await prisma.powerupEvent.findMany({ where, orderBy: { ts: 'desc' }, take: 10_000 })
  for (const e of events) {
    rows.push([e.id, e.matchId, e.creatorId, e.contributorId, e.type, e.action, e.ts?.toISOString?.() ?? String(e.ts), e.expiresAt?.toISOString?.() ?? ''])
  }

  const csv = rows.map(r => toCsvRow(r)).join('\r\n')

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename=powerup-events.csv',
    },
  })
}
