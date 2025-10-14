import { NextResponse } from 'next/server'
import { getStripeClient, isStripeConfigured } from '@/src/lib/stripe'
import { getViewerContext } from '@/src/lib/viewer-context'

export async function POST(req: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })
  }

  const stripe = getStripeClient()
  const context = await getViewerContext(req.headers)

  const successUrl = new URL('/billing/success', process.env.BASE_URL ?? 'http://localhost:3000').toString()
  const cancelUrl = new URL('/billing/cancel', process.env.BASE_URL ?? 'http://localhost:3000').toString()

  let body: any = {}
  try {
    body = await req.json()
  } catch (_) {
    // empty body allowed; default to basic
  }

  const plan = body?.plan === 'pro' ? 'pro' : 'basic'
  const priceData = plan === 'pro'
    ? { currency: 'usd', product_data: { name: 'Power-Up Tracking (Pro)' }, recurring: { interval: 'month' }, unit_amount: 999 }
    : { currency: 'usd', product_data: { name: 'Power-Up Tracking (Basic)' }, recurring: { interval: 'month' }, unit_amount: 599 }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [{ price_data: priceData, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { viewer_user_id: context?.userId ?? 'unknown', plan },
    })

    return NextResponse.json({ url: session.url })
  } catch (err: any) {
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 })
  }
}

