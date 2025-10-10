import Stripe from 'stripe'

let stripeClient: Stripe | null = null

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY)
}

const STRIPE_API_VERSION: Stripe.LatestApiVersion = '2024-06-20'

export function getStripeClient(): Stripe {
  const secret = process.env.STRIPE_SECRET_KEY
  if (!secret) {
    throw new Error('STRIPE_SECRET_KEY is not configured')
  }

  if (!stripeClient) {
    stripeClient = new Stripe(secret, {
      apiVersion: STRIPE_API_VERSION,
    })
  }

  return stripeClient
}
