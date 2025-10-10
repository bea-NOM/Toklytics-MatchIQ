export function isStripeConfigured(): boolean {
  return false
}

export function getStripeClient(): never {
  throw new Error('Stripe integration is currently disabled')
}
