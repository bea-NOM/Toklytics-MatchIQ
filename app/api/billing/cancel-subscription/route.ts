import { NextResponse } from 'next/server'
import { isStripeConfigured, getStripeClient } from '@/src/lib/stripe'
import { getPrismaClient } from '@/src/lib/prisma'

export async function POST(req: Request) {
  if (!isStripeConfigured()) return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })
  const stripe = getStripeClient()
  const prisma = getPrismaClient()

  let body: any = {}
  try { body = await req.json() } catch (_) {}
  const subscriptionId = body?.subscriptionId
  if (!subscriptionId) return NextResponse.json({ error: 'subscriptionId required' }, { status: 400 })

  try {
    await stripe.subscriptions.del(subscriptionId)
    await prisma.subscriptions.updateMany({ where: { stripe_sub_id: subscriptionId }, data: { status: 'CANCELED' } })
    return NextResponse.json({ canceled: true })
  } catch (err: any) {
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 })
  }
}
