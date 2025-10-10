import { describe, it, expect, beforeEach } from 'vitest';
import {
  isGpt5Enabled,
  isGpt5EnabledForUser
} from '../../config/feature-flags';

describe('feature-flags', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    process.env = { ...OLD_ENV };
  });

  it('is false by default', () => {
    delete process.env.ENABLE_GPT5;
    delete process.env.ENABLE_GPT5_ALLOW;
    process.env.DEPLOY_ENV = 'development';
    expect(isGpt5Enabled()).toBe(false);
  });

  it('is true in production with both flags', () => {
    process.env.ENABLE_GPT5 = 'true';
    process.env.ENABLE_GPT5_ALLOW = 'true';
    process.env.DEPLOY_ENV = 'production';
    expect(isGpt5Enabled()).toBe(true);
  });

  it('dev override allows specific users when enabled', () => {
    process.env.ENABLE_GPT5_DEV = 'true';
    process.env.GPT5_DEV_ALLOWLIST = 'alice,bob';
    expect(isGpt5EnabledForUser('alice')).toBe(true);
    expect(isGpt5EnabledForUser('carol')).toBe(false);
  });

  it('dev override with empty allowlist allows all dev users', () => {
    process.env.ENABLE_GPT5_DEV = 'true';
    delete process.env.GPT5_DEV_ALLOWLIST;
    expect(isGpt5EnabledForUser('someone')).toBe(true);
  });
});
