import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { callOpenAI } from '../..//src/lib/openai-client';

describe('openai-client', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    vi.resetAllMocks();
    process.env = { ...OLD_ENV };
  });

  afterEach(() => {
    process.env = OLD_ENV;
  });

  it('throws when OPENAI_API_KEY is missing', async () => {
    delete process.env.OPENAI_API_KEY;
    await expect(callOpenAI('hello')).rejects.toThrow('OPENAI_API_KEY is not set');
  });

  it('throws when fetch returns non-ok with error message', async () => {
    process.env.OPENAI_API_KEY = 'sk-test';

    const mockJson = vi.fn().mockResolvedValue({ error: { message: 'bad things' } });

    // @ts-ignore - mock global fetch
    global.fetch = vi.fn().mockResolvedValue({ ok: false, json: mockJson });

    await expect(callOpenAI('hello')).rejects.toThrow('OpenAI API error: bad things');
    expect(global.fetch).toHaveBeenCalled();
  });

  it('returns parsed data when fetch is ok', async () => {
    process.env.OPENAI_API_KEY = 'sk-test';

    const body = { id: 'r1', output: 'ok' };
    const mockJson = vi.fn().mockResolvedValue(body);

    // @ts-ignore
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: mockJson });

    const res = await callOpenAI('hello');
    expect(res).toEqual(body);
    expect(global.fetch).toHaveBeenCalled();
  });
});
