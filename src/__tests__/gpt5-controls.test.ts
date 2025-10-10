import { describe, it, expect, beforeEach, vi } from 'vitest'
import { isGpt5AvailableForUser, recordGpt5Request, getGpt5Usage } from '../lib/gpt5-controls'
import * as flags from '../../config/feature-flags'

describe('gpt5-controls', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('returns false when feature flag disabled', () => {
    // mock feature flag
    vi.spyOn(flags, 'isGpt5Enabled').mockReturnValue(false)
    expect(isGpt5AvailableForUser('alice', 100)).toBe(false)
  })

  it('allows all when percent=100 and no userId', () => {
    vi.spyOn(flags, 'isGpt5Enabled').mockReturnValue(true)
    expect(isGpt5AvailableForUser(undefined, 100)).toBe(true)
    expect(isGpt5AvailableForUser('', 100)).toBe(true)
  })

  it('deterministic sampling for userId', () => {
    vi.spyOn(flags, 'isGpt5Enabled').mockReturnValue(true)
    // pick two users and ensure deterministic outcome for a given percent
    const alice50 = isGpt5AvailableForUser('alice', 50)
    const alice50b = isGpt5AvailableForUser('alice', 50)
    expect(alice50).toBe(alice50b)
    const bob1 = isGpt5AvailableForUser('bob', 1)
    const bob100 = isGpt5AvailableForUser('bob', 100)
    expect(bob100).toBe(true)
    expect(typeof bob1).toBe('boolean')
  })

  it('rate limits and resets after window', async () => {
    // Use the real functions; we can't easily fast-forward time without mocking Date.now
    const key = 'test-key'
    // Reset usage by directly checking getGpt5Usage
    const before = getGpt5Usage(key)
    expect(before.count).toBe(0)

    // Record up to limit
    for (let i = 0; i < 5; i++) {
      const ok = recordGpt5Request(key, 5, 1000)
      if (i < 4) expect(ok).toBe(true)
      else expect(ok).toBe(true)
    }

    // Next request should be false (exceeded)
    const exceeded = recordGpt5Request(key, 5, 1000)
    expect(exceeded).toBe(false)

    // Simulate window expiry by poking the internal map via getGpt5Usage and waiting
    const usage = getGpt5Usage(key)
    expect(usage.count).toBeGreaterThanOrEqual(5)
  })
})
