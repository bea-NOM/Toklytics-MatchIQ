import { NextResponse } from 'next/server'
import { z } from 'zod'
import { type PrismaClient } from '@prisma/client'
import { getPrismaClient, MissingDatabaseUrlError } from '@/src/lib/prisma'

const bodySchema = z.object({
  matchId: z.string().min(1),
  creatorId: z.string().min(1),
  contributorId: z.string().min(1),
  type: z.enum([
    'glove',
    'vault_glove',
    'time_maker',
    'magic_mist',
    'No.2_booster',
    'No.3_booster',
    'stun_hammer',
  ]),
  action: z.enum(['used', 'held']),
  ts: z.coerce.date().optional(),
  expiresAt: z.coerce.date().optional(),
})

function authorize(req: Request) {
  const token = process.env.MATCHIQ_TRACKING_TOKEN
  if (!token) return true
  const header = req.headers.get('authorization')
  if (!header) return false
  return header === `Bearer ${token}`
}

export async function POST(req: Request) {
  if (!authorize(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let data: z.infer<typeof bodySchema>
  try {
    const json = await req.json()
    data = bodySchema.parse(json)
  } catch (err) {
    return NextResponse.json(
      { error: 'Invalid payload', details: err instanceof Error ? err.message : String(err) },
      { status: 400 },
    )
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

  const now = new Date()
  const ts = data.ts ?? now

  await prisma.powerupEvent.create({
    data: {
      matchId: data.matchId,
      creatorId: data.creatorId,
      contributorId: data.contributorId,
      type: data.type,
      action: data.action,
      ts,
      expiresAt: data.expiresAt ?? null,
    },
  })

  return NextResponse.json({ ok: true })
}
