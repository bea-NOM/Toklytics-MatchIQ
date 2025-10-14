import { afterEach, describe, expect, it, vi } from 'vitest'

afterEach(() => {
  vi.resetModules()
  vi.clearAllMocks()
})

function mockStripeWebhook(event: any, subObj: any) {
  const constructEvent = vi.fn(() => event)
  const subscriptions = { retrieve: vi.fn().mockResolvedValue(subObj) }
  const stripe = { webhooks: { constructEvent }, subscriptions }
  vi.doMock('@/src/lib/stripe', () => ({ isStripeConfigured: () => true, getStripeClient: () => stripe }))
  return { constructEvent, subscriptions }
}

function mockPrisma() {
  const subscriptions = {
    findFirst: vi.fn().mockResolvedValue(null),
    create: vi.fn().mockResolvedValue({}),
    update: vi.fn().mockResolvedValue({}),
    updateMany: vi.fn().mockResolvedValue({}),
  }
  vi.doMock('@/src/lib/prisma', () => ({ getPrismaClient: () => ({ subscriptions }) }))
  return { subscriptions }
}

describe('billing webhook handler', () => {
  it('handles checkout.session.completed and creates a subscription', async () => {
    vi.stubEnv('STRIPE_WEBHOOK_SECRET', 'whsec_test')
  const subObj = { id: 'sub_1', status: 'active', current_period_end: Math.floor(Date.now() / 1000) + 3600 }
  const session = { id: 'sess_1', mode: 'subscription', subscription: 'sub_1', metadata: { plan: 'basic', viewer_user_id: 'user-1' } }
  const event = { type: 'checkout.session.completed', data: { object: session } }
  mockStripeWebhook(event, subObj)
    const prismaMocks = mockPrisma()

    const { POST } = await import('@/app/api/billing/webhook/route')
    const res = await POST(new Request('http://localhost', { method: 'POST', body: JSON.stringify({}), headers: { 'stripe-signature': 'sig' } }))
    const body = await res.json()
    expect(body.received).toBe(true)
    expect(prismaMocks.subscriptions.create).toHaveBeenCalled()
  })
  it('handles invoice.payment_failed and updates subscription to PAST_DUE', async () => {
    const event = { type: 'invoice.payment_failed', data: { object: { subscription: 'sub_789' } } }
    mockStripeWebhook(event, null)
    const prismaMocks = mockPrisma()
    prismaMocks.subscriptions.findFirst.mockResolvedValueOnce({ id: 2, stripe_sub_id: 'sub_789', status: 'ACTIVE', user_id: 'user_1', plan: 'PRO', current_period_end: new Date() } as any)
    prismaMocks.subscriptions.update.mockResolvedValueOnce({ id: 2, status: 'PAST_DUE' } as any)

    const { POST } = await import('@/app/api/billing/webhook/route')
    const res = await POST(new Request('http://localhost', { method: 'POST', body: JSON.stringify({}), headers: { 'stripe-signature': 'sig' } }))
    const body = await res.json()
    expect(body.received).toBe(true)
  expect(prismaMocks.subscriptions.updateMany).toHaveBeenCalled()
  })

  it('handles customer.subscription.updated and deleted events', async () => {
    const eventUpdated = { type: 'customer.subscription.updated', data: { object: { id: 'sub_upd', status: 'canceled', current_period_end: Math.floor(Date.now() / 1000) } } }
    mockStripeWebhook(eventUpdated, null)
    const prismaMocks = mockPrisma()
    prismaMocks.subscriptions.findFirst.mockResolvedValueOnce({ id: 3, stripe_sub_id: 'sub_upd', status: 'ACTIVE', user_id: 'user_2', plan: 'BASIC', current_period_end: new Date() } as any)
    prismaMocks.subscriptions.update.mockResolvedValueOnce({ id: 3, status: 'CANCELED' } as any)

    const { POST } = await import('@/app/api/billing/webhook/route')
    const res1 = await POST(new Request('http://localhost', { method: 'POST', body: JSON.stringify({}), headers: { 'stripe-signature': 'sig' } }))
    const body1 = await res1.json()
    expect(body1.received).toBe(true)
  expect(prismaMocks.subscriptions.updateMany).toHaveBeenCalled()

    // Now simulate deleted
    const eventDeleted = { type: 'customer.subscription.deleted', data: { object: { id: 'sub_upd' } } }
    mockStripeWebhook(eventDeleted, null)
    prismaMocks.subscriptions.findFirst.mockResolvedValueOnce({ id: 3, stripe_sub_id: 'sub_upd', status: 'CANCELED' } as any)
    prismaMocks.subscriptions.update.mockResolvedValueOnce({ id: 3, status: 'DELETED' } as any)

    const res2 = await POST(new Request('http://localhost', { method: 'POST', body: JSON.stringify({}), headers: { 'stripe-signature': 'sig' } }))
    const body2 = await res2.json()
    expect(body2.received).toBe(true)
  expect(prismaMocks.subscriptions.updateMany).toHaveBeenCalled()
  })
})
