let stripeClient: any | null = null

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY)
}

export function getStripeClient(): any {
  const secret = process.env.STRIPE_SECRET_KEY
  if (!secret) {
    throw new Error('Stripe integration is not configured (STRIPE_SECRET_KEY missing)')
  }

  if (stripeClient) return stripeClient

  try {
    // Dynamically require Stripe at runtime so builds without the package or
    // without a configured key won't fail type checks. Keep typing loose
    // to avoid apiVersion literal type mismatches across Stripe versions.
    // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-unsafe-assignment
    const Stripe = require('stripe')
    // Initialize without forcing an apiVersion string to avoid TypeScript
    // union literal mismatches between installed types and runtime expectations.
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    stripeClient = new Stripe(secret)
    return stripeClient
  } catch (err: any) {
    throw new Error('Stripe client not available: ' + String(err?.message || err))
  }
}
