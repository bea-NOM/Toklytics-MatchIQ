import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { captureException, captureMessage } from '../lib/monitoring';

describe('monitoring wrapper', () => {
  let origEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    origEnv = { ...process.env };
    vi.restoreAllMocks();
  });

  afterEach(() => {
    process.env = origEnv;
  });

  it('logs message when MONITORING_DSN is not set', () => {
    delete process.env.MONITORING_DSN;
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {});
    captureMessage('hello', { a: 1 });
    expect(spy).toHaveBeenCalledWith('[monitoring] message', 'hello', { a: 1 });
    spy.mockRestore();
  });

  it('sends message when MONITORING_DSN is set', () => {
    process.env.MONITORING_DSN = 'https://example.com/dsn';
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {});
    captureMessage('hi', { b: 2 });
    expect(spy).toHaveBeenCalledWith('[monitoring] would send message', 'hi', { b: 2 });
    spy.mockRestore();
  });

  it('logs exception when MONITORING_DSN is not set', () => {
    delete process.env.MONITORING_DSN;
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    captureException(new Error('boom'), { route: 'test' });
    expect(spy).toHaveBeenCalled();
    // ensure the message prefix is present in first arg
    const firstArg = spy.mock.calls[0][0];
    expect(String(firstArg)).toContain('[monitoring] exception');
    spy.mockRestore();
  });

  it('would send exception when MONITORING_DSN is set', () => {
    process.env.MONITORING_DSN = 'https://example.com/dsn';
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    captureException('err-string', { x: 1 });
    expect(spy).toHaveBeenCalledWith('[monitoring] would send exception', 'err-string', { x: 1 });
    spy.mockRestore();
  });
});
