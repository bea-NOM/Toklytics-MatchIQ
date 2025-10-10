import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

describe('stripe wrapper', () => {
  const OLD_ENV = process.env

  beforeEach(() => {
    vi.resetModules()
    process.env = { ...OLD_ENV }
  })

  afterEach(() => {
    process.env = OLD_ENV
    vi.restoreAllMocks()
  })

  it('isStripeConfigured returns false when STRIPE_SECRET_KEY is missing', async () => {
    delete process.env.STRIPE_SECRET_KEY
    // import fresh module after env change
    const mod = await import('../lib/stripe')
    const { isStripeConfigured } = mod
    expect(isStripeConfigured()).toBe(false)
  })

  it('isStripeConfigured returns true when STRIPE_SECRET_KEY is present', async () => {
    // use a non-Stripe-looking dummy value to avoid linting rules
    process.env.STRIPE_SECRET_KEY = 'stripe_dummy_key'
    const mod = await import('../lib/stripe')
    const { isStripeConfigured } = mod
    expect(isStripeConfigured()).toBe(true)
  })

  it('getStripeClient throws when STRIPE_SECRET_KEY is missing', async () => {
    delete process.env.STRIPE_SECRET_KEY
    const mod = await import('../lib/stripe')
    const { getStripeClient } = mod
    expect(() => getStripeClient()).toThrow(/STRIPE_SECRET_KEY missing/)
  })

  it('getStripeClient constructs stripe client when package is available', async () => {
    process.env.STRIPE_SECRET_KEY = 'stripe_dummy_key'
    // Mock the stripe package to ensure dynamic require works
    const fakeStripe = vi.fn(() => ({ payments: { list: () => [] } }))
    // Place the mock into require cache by mocking require()
    // Node's module resolution for vitest: we can mock the module name
    vi.mock('stripe', () => {
      return {
        default: fakeStripe,
        __esModule: true,
      }
    })

    const mod = await import('../lib/stripe')
    const { getStripeClient } = mod
    const client = getStripeClient()
    // The wrapper returns the constructed object (fakeStripe())
    expect(client).toBeDefined()
  })
})
