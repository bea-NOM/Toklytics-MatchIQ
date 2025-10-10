import { afterEach, describe, expect, it, vi } from 'vitest'
import { Role, Plan, SubStatus, type PrismaClient } from '@prisma/client'
import { getSubscriptionPlan, hasProAccess, getPlanLabel, resolveSubscriptionPlan } from '@/src/lib/billing'

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('billing helpers', () => {
  it('defaults to starter when env unset', () => {
    vi.stubEnv('BILLING_DEMO_PLAN', '')
    expect(getSubscriptionPlan()).toBe('STARTER')
  })

  it('normalizes env hint to uppercase and recognizes pro', () => {
    vi.stubEnv('BILLING_DEMO_PLAN', 'pro')
    expect(getSubscriptionPlan()).toBe('PRO')
    expect(hasProAccess('PRO')).toBe(true)
    expect(getPlanLabel('PRO')).toBe('Pro')
  })

  it('maps agency to the correct label and access', () => {
    vi.stubEnv('BILLING_DEMO_PLAN', 'agency')
    expect(getSubscriptionPlan()).toBe('AGENCY')
    expect(hasProAccess('AGENCY')).toBe(true)
    expect(getPlanLabel('AGENCY')).toBe('Agency')
  })

  it('treats unknown plans as starter with no pro access', () => {
    vi.stubEnv('BILLING_DEMO_PLAN', 'something')
    expect(getSubscriptionPlan()).toBe('STARTER')
    expect(hasProAccess('STARTER')).toBe(false)
    expect(getPlanLabel('STARTER')).toBe('Starter')
  })

  it('falls back to env hint when context is missing', async () => {
    vi.stubEnv('BILLING_DEMO_PLAN', 'agency')
    const prisma = { subscriptions: { findFirst: vi.fn() } } as unknown as PrismaClient
    const plan = await resolveSubscriptionPlan(prisma, null)
    expect(plan).toBe('AGENCY')
  })

  it('returns agency for admin viewers without hitting the database', async () => {
    const findFirst = vi.fn()
    const prisma = { subscriptions: { findFirst } } as unknown as PrismaClient
    const plan = await resolveSubscriptionPlan(prisma, {
      role: Role.ADMIN,
      userId: 'admin-id',
    } as any)
    expect(plan).toBe('AGENCY')
    expect(findFirst).not.toHaveBeenCalled()
  })

  it('uses the active subscription record when available', async () => {
    const findFirst = vi.fn().mockResolvedValue({
      plan: Plan.PRO,
      status: SubStatus.ACTIVE,
      user_id: 'user-1',
      agency_id: null,
    })
    const prisma = { subscriptions: { findFirst } } as unknown as PrismaClient
    const plan = await resolveSubscriptionPlan(prisma, {
      role: Role.CREATOR,
      userId: 'user-1',
      creatorId: 'creator-1',
      accessibleCreatorIds: ['creator-1'],
    } as any)
    expect(plan).toBe('PRO')
    expect(findFirst).toHaveBeenCalledOnce()
  })
})
