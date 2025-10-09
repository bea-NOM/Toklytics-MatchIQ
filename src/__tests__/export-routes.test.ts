import { afterEach, describe, expect, it, vi } from 'vitest'
import { Role } from '@prisma/client'

class FakeMissingDatabaseUrlError extends Error {}

afterEach(() => {
  vi.resetModules()
  vi.clearAllMocks()
})

function mockCommonModules(overrides: {
  billing?: { resolveSubscriptionPlan: ReturnType<typeof vi.fn>; hasProAccess: (plan: string) => boolean }
  viewerContext?: { getViewerContext: ReturnType<typeof vi.fn> }
  prisma?: { getPrismaClient: () => any }
}) {
  const billing = overrides.billing ?? {
    resolveSubscriptionPlan: vi.fn().mockResolvedValue('PRO'),
    hasProAccess: () => true,
  }
  const viewerContext = overrides.viewerContext ?? {
    getViewerContext: vi.fn().mockResolvedValue({
      role: Role.ADMIN,
      userId: 'admin',
    }),
  }
  const prisma = overrides.prisma ?? {
    getPrismaClient: () => ({}),
  }

  vi.doMock('@/src/lib/billing', () => billing)
  vi.doMock('@/src/lib/viewer-context', () => viewerContext)
  vi.doMock('@/src/lib/prisma', () => ({
    getPrismaClient: prisma.getPrismaClient,
    MissingDatabaseUrlError: FakeMissingDatabaseUrlError,
  }))

  return { billing, viewerContext, prisma }
}

describe('export powerups route', () => {
  it('returns 403 when plan lacks pro access', async () => {
    const getViewerContext = vi.fn().mockResolvedValue({
      role: Role.ADMIN,
      userId: 'admin-id',
    })
    const resolveSubscriptionPlan = vi.fn().mockResolvedValue('STARTER')
    mockCommonModules({
      billing: {
        resolveSubscriptionPlan,
        hasProAccess: () => false,
      },
      viewerContext: { getViewerContext },
    })

    const { GET } = await import('@/app/api/export/powerups/route')
    const res = await GET(new Request('http://localhost/api/export/powerups'))

    expect(res.status).toBe(403)
    expect(await res.json()).toEqual({ error: 'Export is Pro+ only' })
    expect(getViewerContext).toHaveBeenCalledOnce()
    expect(resolveSubscriptionPlan).toHaveBeenCalledOnce()
  })

  it('returns CSV data for authorized users', async () => {
    const powerups = [
      {
        id: 'pu-1',
        type: 'MAGIC_MIST',
        creator_id: 'creator-1',
        holder_viewer_id: 'viewer-1',
        awarded_at: new Date('2025-01-01T00:00:00Z'),
        expiry_at: new Date('2025-01-02T00:00:00Z'),
        source: 'seed',
        active: true,
        holder: { display_name: 'Viewer One' },
        creator: { display_name: 'Creator One' },
      },
    ]
    const getViewerContext = vi.fn().mockResolvedValue({
      role: Role.ADMIN,
      userId: 'admin',
    })
    const getPrismaClient = vi.fn(() => ({
      powerups: {
        findMany: vi.fn().mockResolvedValue(powerups),
      },
    }))

    mockCommonModules({
      viewerContext: { getViewerContext },
      prisma: { getPrismaClient },
    })

    const { GET } = await import('@/app/api/export/powerups/route')
    const res = await GET(new Request('http://localhost/api/export/powerups'))
    const csv = await res.text()

    expect(res.status).toBe(200)
    expect(csv).toContain('"id","type","type_label"')
    expect(csv).toContain('pu-1')
    expect(getViewerContext).toHaveBeenCalledTimes(1)
  })
})

describe('export agencies route', () => {
  it('returns 403 when plan lacks pro access', async () => {
    const getViewerContext = vi.fn().mockResolvedValue({
      role: Role.ADMIN,
      userId: 'admin-id',
    })
    const resolveSubscriptionPlan = vi.fn().mockResolvedValue('STARTER')
    mockCommonModules({
      billing: {
        resolveSubscriptionPlan,
        hasProAccess: () => false,
      },
      viewerContext: { getViewerContext },
    })

    const { GET } = await import('@/app/api/export/agencies/route')
    const res = await GET(new Request('http://localhost/api/export/agencies'))

    expect(res.status).toBe(403)
    expect(await res.json()).toEqual({ error: 'Export is Pro+ only' })
    expect(getViewerContext).toHaveBeenCalledOnce()
    expect(resolveSubscriptionPlan).toHaveBeenCalledOnce()
  })

  it('includes aggregated counts for agencies', async () => {
    const agencies = [
      {
        id: 'agency-1',
        name: 'Agency One',
        memberships: [
          {
            creator: {
              id: 'creator-1',
              display_name: 'Creator One',
              powerups: [
                { id: 'p1', type: 'GLOVE', expiry_at: new Date(Date.now() + 1_000) },
                { id: 'p2', type: 'GLOVE', expiry_at: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) },
              ],
            },
          },
        ],
      },
    ]

    const getViewerContext = vi.fn().mockResolvedValue({
      role: Role.ADMIN,
      userId: 'admin',
    })
    const getPrismaClient = vi.fn(() => ({
      agencies: {
        findMany: vi.fn().mockResolvedValue(agencies),
      },
    }))

    mockCommonModules({
      viewerContext: { getViewerContext },
      prisma: { getPrismaClient },
    })

    const { GET } = await import('@/app/api/export/agencies/route')
    const res = await GET(new Request('http://localhost/api/export/agencies'))
    const csv = await res.text()

    expect(res.status).toBe(200)
    expect(csv).toContain('"agency_id","agency_name"')
    expect(csv).toContain('Agency One')
    expect(csv).toContain('creator-1')
  })
})
