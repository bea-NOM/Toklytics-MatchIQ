import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { POST } from '../../app/api/tiktok/webhook/route'

const ORIGINAL_ENV = { ...process.env }

describe('TikTok webhook route', () => {
  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV }
  })

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV }
    vi.restoreAllMocks()
  })

  it('returns 401 if signature missing', async () => {
    process.env.TIKTOK_WEBHOOK_SECRET = 'devsecret'

    const req = new Request('https://example.test/api/tiktok/webhook', {
      method: 'POST',
      body: JSON.stringify({ hello: 'world' }),
      headers: { 'content-type': 'application/json' },
    })

    const res = await POST(req as any)
    const json = await res.json()
    expect(res.status).toBe(401)
    expect(json.ok).toBe(false)
    expect(json.error).toMatch(/missing signature/i)
  })

  it('inserts webhook when signature valid', async () => {
    process.env.TIKTOK_WEBHOOK_SECRET = 'devsecret'

    // compute HMAC-SHA256 base64 for the payload
    const payload = JSON.stringify({ event: 'test' })
    const encoder = new TextEncoder()
    const key = process.env.TIKTOK_WEBHOOK_SECRET!
    // compute via Node crypto within test using a small helper
    const crypto = await import('crypto')
    const sig = crypto.createHmac('sha256', key).update(payload).digest('base64')

  // mock prisma
  const fakeCreate = vi.fn(async () => ({ id: '1' }))
  const fakePrisma = { webhooks: { create: fakeCreate } }

  // stub getPrismaClient to return fakePrisma
  const prismaModule = await import('../lib/prisma')
  vi.spyOn(prismaModule, 'getPrismaClient').mockImplementation(() => (fakePrisma as any))

    const req = new Request('https://example.test/api/tiktok/webhook', {
      method: 'POST',
      body: payload,
      headers: { 'content-type': 'application/json', 'x-tiktok-signature': sig },
    })

    const res = await POST(req as any)
    const json = await res.json()
    expect(res.status).toBe(200)
    expect(json.ok).toBe(true)
  expect(fakeCreate).toHaveBeenCalled()
  const calls = fakeCreate.mock.calls
  expect(calls.length).toBeGreaterThan(0)
  const calledWith = calls[0][0]
  expect(calledWith).toBeDefined()
  expect(calledWith.data.provider).toBe('tiktok')
  expect(calledWith.data.payload).toEqual({ event: 'test' })
  })
})
