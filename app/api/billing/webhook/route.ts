import { NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { Plan, SubStatus } from '@prisma/client'
import { getStripeClient, isStripeConfigured } from '@/src/lib/stripe'
import { getPrismaClient, MissingDatabaseUrlError } from '@/src/lib/prisma'

type SubscriptionPlan = 'STARTER' | 'PRO' | 'AGENCY'

const stripeStatusMap: Record<Stripe.Subscription.Status, SubStatus> = {
  active: SubStatus.ACTIVE,
  trialing: SubStatus.ACTIVE,
  past_due: SubStatus.PAST_DUE,
  unpaid: SubStatus.PAST_DUE,
  canceled: SubStatus.CANCELED,
  incomplete: SubStatus.INACTIVE,
  incomplete_expired: SubStatus.CANCELED,
  paused: SubStatus.INACTIVE,
}

const planAliases: Record<string, SubscriptionPlan> = {
  starter: 'STARTER',
  STARTER: 'STARTER',
  pro: 'PRO',
  PRO: 'PRO',
  agency: 'AGENCY',
  AGENCY: 'AGENCY',
}

function resolvePlan(metadata?: Stripe.Metadata): SubscriptionPlan | null {
  if (!metadata) return null
  const metaPlan = metadata.plan ?? metadata.Plan ?? metadata.subscription_plan
  if (metaPlan && planAliases[metaPlan]) {
    return planAliases[metaPlan]
  }
  return null
}

function mapPlanFromPrice(subscription: Stripe.Subscription): SubscriptionPlan | null {
  const item = subscription.items.data[0]
  if (!item) return null
  const { price } = item
  const lookupKey = price.lookup_key
  if (!lookupKey) return null
  if (lookupKey === process.env.STRIPE_PRICE_LOOKUP_KEY_PRO) return 'PRO'
  if (lookupKey === process.env.STRIPE_PRICE_LOOKUP_KEY_AGENCY) return 'AGENCY'
  if (lookupKey === process.env.STRIPE_PRICE_LOOKUP_KEY || lookupKey === process.env.STRIPE_PRICE_LOOKUP_KEY_STARTER) {
    return 'STARTER'
  }
  return null
}

async function upsertSubscription(params: {
  prisma: ReturnType<typeof getPrismaClient>
  userId?: string
  agencyId?: string
  plan: SubscriptionPlan
  stripeCustomerId: string
  stripeSubId?: string
  currentPeriodEnd?: Date | null
  status: SubStatus
}) {
  const { prisma, userId, agencyId, plan, stripeCustomerId, stripeSubId, currentPeriodEnd, status } = params

  const where = agencyId ? { agency_id: agencyId } : { user_id: userId }

  const existing = await prisma.subscriptions.findFirst({
    where,
    orderBy: { current_period_end: 'desc' },
  })

  const data = {
    plan: Plan[plan],
    stripe_customer_id: stripeCustomerId,
    stripe_sub_id: stripeSubId ?? null,
    current_period_end: currentPeriodEnd ?? null,
    status,
    user_id: userId ?? null,
    agency_id: agencyId ?? null,
  }

  if (existing) {
    await prisma.subscriptions.update({
      where: { id: existing.id },
      data,
    })
  } else {
    await prisma.subscriptions.create({ data })
  }
}

async function handleCheckoutSession(
  stripe: Stripe,
  prisma: ReturnType<typeof getPrismaClient>,
  session: Stripe.Checkout.Session,
) {
  const stripeCustomerId =
    typeof session.customer === 'string' ? session.customer : session.customer?.id ?? undefined
  const stripeSubId =
    typeof session.subscription === 'string'
      ? session.subscription
      : session.subscription?.id ?? undefined

  if (!stripeCustomerId) {
    throw new Error('Stripe checkout session missing customer identifier')
  }

  const metadataPlan = resolvePlan(session.metadata ?? undefined)

  let subscription: Stripe.Subscription | null = null
  if (stripeSubId) {
    subscription = await stripe.subscriptions.retrieve(stripeSubId)
  }

  const plan =
    metadataPlan ??
    (subscription ? resolvePlan(subscription.metadata ?? undefined) ?? mapPlanFromPrice(subscription) : null)

  if (!plan) {
    throw new Error('Unable to determine subscription plan from checkout session')
  }

  const targetUserId = session.metadata?.userId || undefined
  const targetAgencyId = session.metadata?.agencyId || undefined

  if (!targetUserId && !targetAgencyId) {
    throw new Error('Checkout session metadata missing user reference')
  }

  const status = subscription ? stripeStatusMap[subscription.status] ?? SubStatus.ACTIVE : SubStatus.ACTIVE
  const currentPeriodEnd = subscription
    ? new Date(subscription.current_period_end * 1000)
    : session.expires_at
    ? new Date(session.expires_at * 1000)
    : null

  await upsertSubscription({
    prisma,
    userId: targetUserId,
    agencyId: targetAgencyId,
    plan,
    stripeCustomerId,
    stripeSubId,
    currentPeriodEnd,
    status,
  })
}

async function handleSubscriptionLifecycle(
  prisma: ReturnType<typeof getPrismaClient>,
  subscription: Stripe.Subscription,
) {
  const stripeCustomerId =
    typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id

  const plan =
    resolvePlan(subscription.metadata ?? undefined) ?? mapPlanFromPrice(subscription) ?? 'STARTER'

  const status = stripeStatusMap[subscription.status] ?? SubStatus.INACTIVE
  const currentPeriodEnd = subscription.current_period_end
    ? new Date(subscription.current_period_end * 1000)
    : null

  const userId = subscription.metadata?.userId
  const agencyId = subscription.metadata?.agencyId

  await upsertSubscription({
    prisma,
    userId: userId || undefined,
    agencyId: agencyId || undefined,
    plan,
    stripeCustomerId,
    stripeSubId: subscription.id,
    currentPeriodEnd,
    status,
  })
}

export async function POST(req: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: 'Stripe is not configured' }, { status: 503 })
  }

  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'Missing STRIPE_WEBHOOK_SECRET' }, { status: 503 })
  }

  const rawBody = await req.text()
  const signature = req.headers.get('stripe-signature')
  if (!signature) {
    return NextResponse.json({ error: 'Missing Stripe signature header' }, { status: 400 })
  }

  const stripe = getStripeClient()

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, secret)
  } catch (error) {
    console.error('[stripe:webhook] verification failed', error)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
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

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        await handleCheckoutSession(stripe, prisma, event.data.object as Stripe.Checkout.Session)
        break
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        await handleSubscriptionLifecycle(prisma, event.data.object as Stripe.Subscription)
        break
      }
      default:
        break
    }
  } catch (error) {
    console.error('[stripe:webhook] handler error', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
