import { describe, it, expect, vi } from 'vitest'
import { checkPrForGpt5Keywords, DEFAULT_KEYWORDS } from '../lib/gpt5-guard'

describe('gpt5 guard helper', () => {
  it('skips when no PR present', async () => {
    const res = await checkPrForGpt5Keywords({ pr: undefined })
    expect(res.skipped).toBe(true)
    expect(res.ok).toBe(true)
  })

  it('skips when label present', async () => {
    const pr = { number: 1, labels: [{ name: 'gpt5-approve' }] }
    const res = await checkPrForGpt5Keywords({ pr })
    expect(res.skipped).toBe(true)
  })

  it('skips when listFiles not provided', async () => {
    const pr = { number: 2, labels: [] }
    const core = { info: vi.fn(), warning: vi.fn(), setFailed: vi.fn(() => { throw new Error('failed') }) }
    const res = await checkPrForGpt5Keywords({ pr, coreSafe: core })
    expect(res.skipped).toBe(true)
    expect(core.warning).toHaveBeenCalled()
  })

  it('skips when listFiles throws', async () => {
    const pr = { number: 3, labels: [] }
    const listFiles = vi.fn(() => { throw new Error('boom') })
    const core = { info: vi.fn(), warning: vi.fn(), setFailed: vi.fn(() => { throw new Error('failed') }) }
    const res = await checkPrForGpt5Keywords({ pr, listFiles, coreSafe: core })
    expect(res.skipped).toBe(true)
    expect(core.warning).toHaveBeenCalled()
  })

  it('fails when a keyword is found in a patch', async () => {
    const pr = { number: 4, labels: [] }
    const listFiles = vi.fn(async () => ({ data: [{ patch: 'some change\n ENABLE_GPT5=true \n' }] }))
    const core = {
      info: vi.fn(),
      warning: vi.fn(),
      setFailed: vi.fn((m: string) => { throw new Error(m) }),
    }

    await expect(checkPrForGpt5Keywords({ pr, listFiles, coreSafe: core })).rejects.toThrow(/ENABLE_GPT5/)
  })

  it('returns ok when no keywords present', async () => {
    const pr = { number: 5, labels: [] }
    const listFiles = vi.fn(async () => ({ data: [{ patch: 'normal change\n nothing to see here' }] }))
    const core = { info: vi.fn(), warning: vi.fn(), setFailed: vi.fn((m: string) => { throw new Error(m) }) }
    const res = await checkPrForGpt5Keywords({ pr, listFiles, coreSafe: core })
    expect(res.ok).toBe(true)
    expect(res.skipped).toBe(false)
  })

  it('respects custom keywords', async () => {
    const pr = { number: 6, labels: [] }
    const listFiles = vi.fn(async () => ({ data: [{ patch: 'foo=1' }] }))
    await expect(checkPrForGpt5Keywords({ pr, listFiles, keywords: ['foo'] })).rejects.toThrow(/foo/)
  })
})
