// Small runtime feature flag helper. Reads env vars and exposes flags.
// Protective guard: require both ENABLE_GPT5 and ENABLE_GPT5_ALLOW to be 'true'
// in order to enable the preview model. This avoids accidental flips.
export const FEATURE_FLAGS = {
  enableGpt5:
    (process.env.ENABLE_GPT5 || 'false').toLowerCase() === 'true' &&
    (process.env.ENABLE_GPT5_ALLOW || 'false').toLowerCase() === 'true',
};

export type FeatureFlags = typeof FEATURE_FLAGS;
