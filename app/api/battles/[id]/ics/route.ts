import { NextResponse } from 'next/server'
import { prisma } from '@/src/lib/prisma' // or '../../../../../src/lib/prisma'

function toICS(d: Date) {
  return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
}

export async function GET(_req: Request, ctx: { params: { id: string } }) {
  const { id } = ctx.params
  const battle = await prisma.battles.findUnique({ where: { id } })
  if (!battle) return new NextResponse('Not found', { status: 404 })

  const start = new Date(battle.scheduled_at)
  const end = new Date(start.getTime() + 30 * 60 * 1000) // 30m default
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Toklytics Battles//EN',
    'BEGIN:VEVENT',
    `UID:${battle.id}@toklytics.net`,
    `DTSTAMP:${toICS(new Date())}`,
    `DTSTART:${toICS(start)}`,
    `DTEND:${toICS(end)}`,
    `SUMMARY:${battle.title}`,
    `DESCRIPTION:Toklytics – Battles`,
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