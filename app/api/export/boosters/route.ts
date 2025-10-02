import { NextResponse } from 'next/server'
import { prisma } from '@/src/lib/prisma'

function allowExport() {
  // TODO: plug real auth + Stripe. For now, env switch.
  const plan = process.env.BILLING_DEMO_PLAN ?? 'STARTER'
  return plan === 'PRO' || plan === 'AGENCY'
}

export async function GET() {
  if (!allowExport()) {
    return NextResponse.json({ error: 'Export is Pro+ only' }, { status: 403 })
  }

  const boosters = await prisma.boosters.findMany({
    where: { active: true },
    orderBy: { expiry_at: 'asc' },
    take: 500,
  })

  const rows = [
    ['id','type','creator_id','holder_viewer_id','awarded_at','expiry_at','source','active'],
    ...boosters.map(b => [
      b.id, b.type, b.creator_id, b.holder_viewer_id,
      b.awarded_at.toISOString(), b.expiry_at.toISOString(), b.source, String(b.active)
    ])
  ]
  const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\r\n')

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename=boosters.csv',
    },
  })
}
