import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import * as monitoring from '../lib/monitoring'

describe('monitoring wrapper', () => {
  let origEnv: NodeJS.ProcessEnv

  beforeEach(() => {
    origEnv = { ...process.env }
    // spy on console methods
    vi.spyOn(console, 'info').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    process.env = { ...origEnv }
    vi.restoreAllMocks()
  })

  it('logs fallback when MONITORING_DSN is not present', () => {
    delete process.env.MONITORING_DSN

    monitoring.captureMessage('test-message', { foo: 'bar' })
    monitoring.captureException(new Error('boom'), { context: 'x' })

    expect(console.info).toHaveBeenCalled()
    expect(console.error).toHaveBeenCalled()
    const infoCall = (console.info as any).mock.calls[0][0]
    expect(infoCall).toMatch(/\[monitoring\] message/)
    const errCall = (console.error as any).mock.calls[0][0]
    expect(errCall).toMatch(/\[monitoring\] exception/)
  })

  it('uses would send variants when MONITORING_DSN is set', () => {
    process.env.MONITORING_DSN = 'https://example/1'

    monitoring.captureMessage('m2', { a: 1 })
    monitoring.captureException('err-string', { b: 2 })

    expect(console.info).toHaveBeenCalled()
    expect(console.warn).toHaveBeenCalled()
    const infoCalls = (console.info as any).mock.calls.map((c: any[]) => c[0])
    expect(infoCalls.find((s: string) => /would send message/.test(s))).toBeTruthy()
    const warnCalls = (console.warn as any).mock.calls.map((c: any[]) => c[0])
    expect(warnCalls.find((s: string) => /would send exception/.test(s))).toBeTruthy()
  })

  it('handles sensitive meta without throwing', () => {
    delete process.env.MONITORING_DSN
    const meta = { access_token: 'sekrit', refresh_token: 'alsosekrit' }
    expect(() => monitoring.captureMessage('m3', meta)).not.toThrow()
    expect(() => monitoring.captureException(new Error('boom2'), meta)).not.toThrow()
  })
})
