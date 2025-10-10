import { describe, it, expect } from 'vitest'
import { deriveDashboardFilters } from '../lib/dashboard-filters'

describe('deriveDashboardFilters', () => {
  it('returns empty parsedFilters when proEnabled is false', () => {
    const params = { creator: 'alice', type: 'free' }
    const result = deriveDashboardFilters(params, false)
    expect(result.parsedFilters).toEqual({})
    expect(result.normalizedTypeFilter).toBe('FREE')
  })

  it('parses dates and normalizes type when proEnabled is true', () => {
    const params = {
      creator: ' bob ',
      supporter: 'carol',
      type: ' Premium ',
      expiresAfter: '2020-01-01',
      expiresBefore: '2020-12-31',
    }

    const result = deriveDashboardFilters(params, true)
    expect(result.rawFilters.creator).toBe('bob')
    expect(result.parsedFilters.creatorFilter).toBe('bob')
    expect(result.parsedFilters.supporterFilter).toBe('carol')
    expect(result.normalizedTypeFilter).toBe('PREMIUM')
    expect(result.parsedFilters.typeFilter).toBe('PREMIUM')
    expect(result.parsedFilters.expiresAfter).toBeInstanceOf(Date)
    expect(result.parsedFilters.expiresBefore).toBeInstanceOf(Date)
  })

  it('handles invalid dates gracefully', () => {
    const params = { expiresAfter: 'not-a-date', expiresBefore: '' }
    const result = deriveDashboardFilters(params, true)
    expect(result.parsedFilters.expiresAfter).toBeUndefined()
    expect(result.parsedFilters.expiresBefore).toBeUndefined()
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
