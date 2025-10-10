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
};

export function isGpt5Enabled(): boolean {
  // Only allow GPT-5 if raw flags are set and the deploy environment is production.
  return (
    FEATURE_FLAGS.enableGpt5Raw &&
    (FEATURE_FLAGS.deployEnv === 'production' ||
      FEATURE_FLAGS.deployEnv === 'prod')
  );
}

export type FeatureFlags = typeof FEATURE_FLAGS;
