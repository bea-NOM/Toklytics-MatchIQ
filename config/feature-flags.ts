// Small runtime feature flag helper. Reads env vars dynamically so tests and
// runtime changes are respected.

export type FeatureFlags = {
  enableGpt5Raw: boolean;
  deployEnv: string;
  enableGpt5Dev: boolean;
  gpt5DevAllowlist: string[];
};

function readFlags(): FeatureFlags {
  return {
    enableGpt5Raw:
      (process.env.ENABLE_GPT5 || 'false').toLowerCase() === 'true' &&
      (process.env.ENABLE_GPT5_ALLOW || 'false').toLowerCase() === 'true',
    deployEnv: process.env.DEPLOY_ENV || process.env.NODE_ENV || 'development',
    enableGpt5Dev: (process.env.ENABLE_GPT5_DEV || 'false').toLowerCase() === 'true',
    gpt5DevAllowlist: (process.env.GPT5_DEV_ALLOWLIST || '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean),
  };
}

export function isGpt5Enabled(): boolean {
  const flags = readFlags();
  return flags.enableGpt5Raw && (flags.deployEnv === 'production' || flags.deployEnv === 'prod');
}

export function isGpt5EnabledForUser(userId?: string): boolean {
  // Production path
  if (isGpt5Enabled()) return true;

  const flags = readFlags();
  // Dev override path: only if enabled and user is on allowlist (or allowlist empty -> allow all)
  if (flags.enableGpt5Dev) {
    if (!userId) return true; // no userId provided -> allow for dev
    if (flags.gpt5DevAllowlist.length === 0) return true; // empty allowlist means allow all dev users
    return flags.gpt5DevAllowlist.includes(userId);
  }

  return false;
}
