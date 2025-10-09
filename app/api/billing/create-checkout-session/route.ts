import { NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { Role } from '@prisma/client'
import { getStripeClient, isStripeConfigured } from '@/src/lib/stripe'
import { getViewerContext } from '@/src/lib/viewer-context'
import { getPrismaClient, MissingDatabaseUrlError } from '@/src/lib/prisma'

type CreateCheckoutPayload = {
  plan?: 'PRO' | 'AGENCY'
  successPath?: string
  cancelPath?: string
}

const priceIdCache = new Map<string, string>()

async function resolvePriceId(stripe: Stripe, raw: string): Promise<string> {
  if (priceIdCache.has(raw)) {
    return priceIdCache.get(raw)!
  }

  if (raw.startsWith('price_')) {
    priceIdCache.set(raw, raw)
    return raw
  }

  const prices = await stripe.prices.list({
    lookup_keys: [raw],
    limit: 1,
  })

  const price = prices.data[0]
  if (!price) {
    throw new Error(`No Stripe price found for lookup key "${raw}"`)
  }

  priceIdCache.set(raw, price.id)
  return price.id
}

function priceConfigForPlan(plan: 'PRO' | 'AGENCY'): string | null {
  if (plan === 'PRO') {
    return (
      process.env.STRIPE_PRICE_ID_PRO ??
      process.env.STRIPE_PRICE_LOOKUP_KEY_PRO ??
      process.env.STRIPE_PRICE_ID ??
      process.env.STRIPE_PRICE_LOOKUP_KEY ??
      null
    )
  }

  if (plan === 'AGENCY') {
    return process.env.STRIPE_PRICE_ID_AGENCY ?? process.env.STRIPE_PRICE_LOOKUP_KEY_AGENCY ?? null
  }

  return null
}

function buildUrl(path: string | undefined, fallback: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL ?? 'http://localhost:3000'
  if (!path) {
    return `${base}${fallback}`
  }
  const normalized = path.startsWith('/') ? path : `/${path}`
  return `${base}${normalized}`
}

export async function POST(req: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: 'Stripe is not configured' }, { status: 503 })
  }

  const stripe = getStripeClient()

  let payload: CreateCheckoutPayload = {}
  try {
    payload = await req.json()
  } catch {
    // no body provided, fall back to defaults
  }

  const plan = payload.plan ?? 'PRO'
  if (plan !== 'PRO' && plan !== 'AGENCY') {
    return NextResponse.json({ error: 'Unsupported plan' }, { status: 400 })
  }

  const priceConfig = priceConfigForPlan(plan)
  if (!priceConfig) {
    return NextResponse.json({ error: 'Stripe price is not configured for this plan' }, { status: 500 })
  }

  const context = await getViewerContext(req.headers)
  if (!context) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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

  const metadata: Record<string, string> = {
    plan,
    userId: context.userId,
    role: context.role,
  }

  if (context.role === Role.AGENCY && 'agencyId' in context) {
    metadata.agencyId = context.agencyId
  }

  const existingSubscription = await prisma.subscriptions.findFirst({
    where:
      context.role === Role.AGENCY && 'agencyId' in context
        ? { agency_id: context.agencyId }
        : { user_id: context.userId },
    orderBy: { current_period_end: 'desc' },
  })

  const user = await prisma.users.findUnique({
    where: { id: context.userId },
    select: { email: true },
  })

  const priceId = await resolvePriceId(stripe, priceConfig)

  const successUrl = buildUrl(payload.successPath, '/billing/success') + '?session_id={CHECKOUT_SESSION_ID}'
  const cancelUrl = buildUrl(payload.cancelPath, '/billing/cancelled')

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    allow_promotion_codes: true,
    customer: existingSubscription?.stripe_customer_id ?? undefined,
    customer_email: existingSubscription ? undefined : user?.email,
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata,
    subscription_data: {
      metadata,
    },
    customer_creation: existingSubscription ? undefined : 'if_required',
  })

  return NextResponse.json({ url: session.url })
}
