import { afterEach, describe, expect, it, vi } from 'vitest'
import { getSubscriptionPlan, hasProAccess, getPlanLabel } from '@/src/lib/billing'

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
})
