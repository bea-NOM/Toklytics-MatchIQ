import { NextResponse } from 'next/server'
import { type PrismaClient } from '@prisma/client'
import { getPrismaClient, MissingDatabaseUrlError } from '@/src/lib/prisma' // or '../../../../../src/lib/prisma'

function toICS(d: Date) {
  return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
}

export async function GET(_req: Request, ctx: { params: { id: string } }) {
  let prisma: PrismaClient
  try {
    prisma = getPrismaClient()
  } catch (error) {
    if (error instanceof MissingDatabaseUrlError) {
      return new NextResponse('Database connection not configured', { status: 503 })
    }
    throw error
  }

  const { id } = ctx.params
  const battle = await prisma.battles.findUnique({ where: { id } })
  if (!battle) return new NextResponse('Not found', { status: 404 })

  const now = new Date()
  const start = new Date(battle.scheduled_at)
  const end = new Date(start.getTime() + 30 * 60 * 1000) // 30m default
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Toklytics MatchIQ//EN',
    `BEGIN:VEVENT`,
    `UID:${battle.id}@toklytics.com`,
    `DTSTAMP:${toICS(now)}`,
    `DTSTART:${toICS(start)}`,
    `DTEND:${toICS(end)}`,
    `SUMMARY:${battle.title}`,
    `DESCRIPTION:Toklytics – MatchIQ`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')

  return new NextResponse(ics, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename=battle-${battle.id}.ics`,
    },
  })
}
