// Small runtime feature flag helper. Reads env vars and exposes flags.
export const FEATURE_FLAGS = {
  enableGpt5: (process.env.ENABLE_GPT5 || 'false').toLowerCase() === 'true',
};

export type FeatureFlags = typeof FEATURE_FLAGS;
