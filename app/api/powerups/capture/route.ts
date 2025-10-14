import { NextResponse } from 'next/server'
import { getPrismaClient, MissingDatabaseUrlError } from '@/src/lib/prisma'
import { getViewerContext } from '@/src/lib/viewer-context'

export async function POST(req: Request) {
  const context = await getViewerContext(req.headers)
  if (!context) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: any
  try {
    body = await req.json()
  } catch (err) {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { matchId, creatorId, contributorId, type, action, expiresAt } = body ?? {}

  if (!matchId || !creatorId || !contributorId || !type || !action) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  let prisma
  try {
    prisma = getPrismaClient()
  } catch (error) {
    if (error instanceof MissingDatabaseUrlError) {
      return NextResponse.json({ error: 'Database connection not configured' }, { status: 503 })
    }
    throw error
  }

  const data: any = {
    matchId: String(matchId),
    creatorId: String(creatorId),
    contributorId: String(contributorId),
    type: String(type),
    action: String(action),
  }

  if (expiresAt) {
    const d = new Date(expiresAt)
    if (Number.isNaN(d.getTime())) {
      return NextResponse.json({ error: 'Invalid expiresAt' }, { status: 400 })
    }
    data.expiresAt = d
  }

  const created = await prisma.powerupEvent.create({ data })

  return NextResponse.json(created, { status: 201 })
}
