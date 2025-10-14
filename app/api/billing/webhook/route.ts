import { NextResponse } from 'next/server'
import { getStripeClient, isStripeConfigured } from '@/src/lib/stripe'
import { getPrismaClient } from '@/src/lib/prisma'
import { Plan, SubStatus } from '@prisma/client'

// Helper to map Stripe status to SubStatus
function mapStripeStatus(status: string): SubStatus {
  switch (status) {
    case 'active':
    case 'trialing':
      return SubStatus.ACTIVE
    case 'past_due':
      return SubStatus.PAST_DUE
    case 'canceled':
    case 'unpaid':
    case 'incomplete_expired':
      return SubStatus.CANCELED
    default:
      return SubStatus.INACTIVE
  }
}

export async function POST(req: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })
  }

  const stripe = getStripeClient()
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
  }

  const sig = req.headers.get('stripe-signature') || ''
  const payload = await req.text()

  let event
  try {
    event = stripe.webhooks.constructEvent(payload, sig, webhookSecret)
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook signature verification failed: ${String(err?.message || err)}` }, { status: 400 })
  }

  const prisma = getPrismaClient()

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        // only handle subscription mode
        if (session.mode !== 'subscription') break

        const subscriptionId = session.subscription
        // fetch subscription from Stripe to get full details
        const sub = await stripe.subscriptions.retrieve(subscriptionId)

        const viewerUserId = session.metadata?.viewer_user_id ?? session.client_reference_id ?? null

  // Map to our Plan enum: prefer metadata.plan if present
  const planName = (session.metadata?.plan ?? session.metadata?.price ?? 'basic').toLowerCase()
  const PlanAny = Plan as any
  const plan = planName === 'pro' ? PlanAny.PRO : planName === 'basic' ? PlanAny.BASIC : PlanAny.STARTER

        const status = mapStripeStatus(sub.status)
        const currentPeriodEnd = sub.current_period_end ? new Date(sub.current_period_end * 1000) : null

        // find existing subscription by stripe_sub_id (not necessarily unique in schema)
        const existing = await prisma.subscriptions.findFirst({ where: { stripe_sub_id: subscriptionId } })
        if (existing) {
          await prisma.subscriptions.update({
            where: { id: existing.id },
            data: {
              user_id: viewerUserId ?? undefined,
              status,
              plan,
              stripe_customer_id: sub.customer?.toString() ?? '',
              current_period_end: currentPeriodEnd ?? undefined,
              max_creators: 1,
            },
          })
        } else {
          await prisma.subscriptions.create({
            data: {
              user_id: viewerUserId ?? undefined,
              agency_id: null,
              status,
              plan,
              stripe_customer_id: sub.customer?.toString() ?? '',
              stripe_sub_id: subscriptionId,
              current_period_end: currentPeriodEnd ?? undefined,
              max_creators: 1,
            },
          })
        }

        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object
        const subscriptionId = invoice.subscription
        if (!subscriptionId) break
        await prisma.subscriptions.updateMany({ where: { stripe_sub_id: subscriptionId }, data: { status: SubStatus.PAST_DUE } })
        break
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subObj = event.data.object
        const subscriptionId = subObj.id
        const status = mapStripeStatus(subObj.status)
        const currentPeriodEnd = subObj.current_period_end ? new Date(subObj.current_period_end * 1000) : null

        await prisma.subscriptions.updateMany({ where: { stripe_sub_id: subscriptionId }, data: { status, current_period_end: currentPeriodEnd ?? undefined } })
        break
      }

      default:
        // ignore other events
        break
    }

    return NextResponse.json({ received: true })
  } catch (err: any) {
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 })
  }
}

