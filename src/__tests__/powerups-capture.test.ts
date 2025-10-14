import { describe, it, expect, vi, afterEach } from 'vitest'

class FakeMissingDatabaseUrlError extends Error {}

afterEach(() => {
  vi.resetModules()
  vi.clearAllMocks()
})

function mockPrisma(createMock = {}) {
  const getPrismaClient = vi.fn(() => createMock)
  vi.doMock('@/src/lib/prisma', () => ({ getPrismaClient, MissingDatabaseUrlError: FakeMissingDatabaseUrlError }))
  return { getPrismaClient }
}

function mockViewerContext(returns: any) {
  vi.doMock('@/src/lib/viewer-context', () => ({ getViewerContext: vi.fn().mockResolvedValue(returns) }))
}

describe('POST /api/powerups/capture', () => {
  it('returns 401 when no viewer context', async () => {
    mockPrisma()
    mockViewerContext(null)
    const { POST } = await import('@/app/api/powerups/capture/route')
    const res = await POST(new Request('http://localhost', { method: 'POST', body: JSON.stringify({}) }))
    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({ error: 'Unauthorized' })
  })

  it('creates an event with valid payload', async () => {
    const created = { id: 'evt-1', matchId: 'm1', creatorId: 'c1', contributorId: 'u1', type: 'GLOVE', action: 'used', ts: new Date().toISOString() }
    const prismaMock = { powerupEvent: { create: vi.fn().mockResolvedValue(created) } }
    const { getPrismaClient } = mockPrisma(prismaMock)
    mockViewerContext({ userId: 'u1', role: 'CREATOR' })

    const { POST } = await import('@/app/api/powerups/capture/route')
    const payload = { matchId: 'm1', creatorId: 'c1', contributorId: 'u1', type: 'GLOVE', action: 'used' }
    const res = await POST(new Request('http://localhost', { method: 'POST', body: JSON.stringify(payload) }))

    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body).toEqual(created)
    expect(getPrismaClient).toHaveBeenCalled()
    expect(prismaMock.powerupEvent.create).toHaveBeenCalledWith({ data: expect.objectContaining({ matchId: 'm1', creatorId: 'c1' }) })
  })
})
