import { describe, expect, it } from 'vitest'
import { deriveDashboardFilters } from '@/src/lib/dashboard-filters'

describe('deriveDashboardFilters', () => {
  it('returns empty parsed filters when pro is disabled', () => {
    const state = deriveDashboardFilters(
      {
        creator: ' Alice ',
        supporter: ['Bob'],
        type: 'magic_mist',
        expiresAfter: '2025-01-01T00:00',
      },
      false,
    )

    expect(state.rawFilters).toEqual({
      creator: 'Alice',
      supporter: 'Bob',
      type: 'magic_mist',
      expiresAfter: '2025-01-01T00:00',
      expiresBefore: '',
    })
    expect(state.normalizedTypeFilter).toBe('MAGIC_MIST')
    expect(state.parsedFilters).toEqual({})
  })

  it('parses filters when pro is enabled', () => {
    const state = deriveDashboardFilters(
      {
        creator: 'Creator42',
        supporter: 'Supporter77',
        type: 'glove',
        expiresAfter: '2025-01-01T12:00',
        expiresBefore: 'invalid',
      },
      true,
    )

    expect(state.parsedFilters.creatorFilter).toBe('Creator42')
    expect(state.parsedFilters.supporterFilter).toBe('Supporter77')
    expect(state.parsedFilters.typeFilter).toBe('GLOVE')
    expect(state.parsedFilters.expiresAfter).instanceOf(Date)
    expect(state.parsedFilters.expiresBefore).toBeUndefined()
  })

  it('handles missing search params gracefully', () => {
    const state = deriveDashboardFilters(undefined, true)
    expect(state.rawFilters).toEqual({
      creator: '',
      supporter: '',
      type: '',
      expiresAfter: '',
      expiresBefore: '',
    })
    expect(state.parsedFilters).toEqual({})
  })
})
