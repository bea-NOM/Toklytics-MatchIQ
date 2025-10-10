// Small runtime feature flag helper. Reads env vars and exposes flags.
// Protective guard: require both ENABLE_GPT5 and ENABLE_GPT5_ALLOW to be 'true'
// in order to enable the preview model. This avoids accidental flips.
export const FEATURE_FLAGS = {
  // The flag requires both variables and a proper deploy environment.
  enableGpt5Raw:
    (process.env.ENABLE_GPT5 || 'false').toLowerCase() === 'true' &&
    (process.env.ENABLE_GPT5_ALLOW || 'false').toLowerCase() === 'true',
  // Deploy environment guard. Only allow on production by default.
  deployEnv: process.env.DEPLOY_ENV || process.env.NODE_ENV || 'development',
  // Dev override: allows enabling GPT-5 for a whitelist of developer userIds
  enableGpt5Dev: (process.env.ENABLE_GPT5_DEV || 'false').toLowerCase() === 'true',
  // Comma-separated list of userIds allowed in dev override (optional)
  gpt5DevAllowlist: (process.env.GPT5_DEV_ALLOWLIST || '').split(',').map(s => s.trim()).filter(Boolean),
};

export function isGpt5Enabled(): boolean {
  // Only allow GPT-5 if raw flags are set and the deploy environment is production.
  return (
    FEATURE_FLAGS.enableGpt5Raw &&
    (FEATURE_FLAGS.deployEnv === 'production' ||
      FEATURE_FLAGS.deployEnv === 'prod')
  );
}

/**
 * Returns true if GPT-5 is enabled for a given userId. This allows a dev override
 * where specific userIds can be granted access when ENABLE_GPT5_DEV=true.
 */
export function isGpt5EnabledForUser(userId?: string): boolean {
  // Production path
  if (isGpt5Enabled()) return true;

  // Dev override path: only if enabled and user is on allowlist (or allowlist empty -> allow all)
  if (FEATURE_FLAGS.enableGpt5Dev) {
    if (!userId) return true; // no userId provided -> allow for dev
    const list = FEATURE_FLAGS.gpt5DevAllowlist;
    if (list.length === 0) return true; // empty allowlist means allow all dev users
    return list.includes(userId);
  }

  return false;
}

export type FeatureFlags = typeof FEATURE_FLAGS;
