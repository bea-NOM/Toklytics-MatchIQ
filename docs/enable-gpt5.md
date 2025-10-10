# Enabling GPT-5 (Preview) for clients

This document explains how to safely enable the GPT-5 (Preview) model for all clients in this repository using a runtime feature flag and what to do on the OpenAI side.

## Summary

- This repo contains a small feature-flag helper at `config/feature-flags.ts` that reads the environment variable `ENABLE_GPT5`.
- When `ENABLE_GPT5=true`, `src/lib/ai-client.ts` will select `gpt-5-preview` as the model name. Replace that string with the exact model identifier you receive from OpenAI.

## Steps: OpenAI / provider side

1. Request access to the GPT-5 preview from OpenAI (or your provider). This often requires joining a waitlist or getting invited to a preview program.
2. Once granted, note the exact model identifier (for example `gpt-5-preview` or another name). Use that exact string when wiring your client.
3. Ensure you have an API key with the correct permissions to call that model.

## Steps: Repo / runtime side

1. Add the environment variable in your environment or `.env` file (do NOT commit secrets):

```env
ENABLE_GPT5=true
OPENAI_API_KEY=sk_...
```

2. For local development, copy `.env.example` to `.env` and set `ENABLE_GPT5=true`.

3. For production, add `ENABLE_GPT5=true` to your deployment environment variables only when you're ready to enable the preview for clients. Consider rolling this out gradually.

## CI/CD and safety

- Prefer gating `ENABLE_GPT5` behind a deployment or release toggle in your environment provider (Vercel, Netlify, Kubernetes, etc.).
- For extra safety, restrict which build or runtime environments have access to the OpenAI API key using secret scopes or environment protection rules.

## Code reference

- `config/feature-flags.ts` — central place to read the feature flag.
- `src/lib/ai-client.ts` — example wrapper that selects a model based on the flag. Replace the placeholder call with your real SDK or HTTP code.

## Rollback

To disable GPT-5, set `ENABLE_GPT5=false` and redeploy. The client will then use the fallback model.

## Notes

- This repo change only reads an env var — enabling GPT-5 globally requires the provider-side access and valid API credentials.
- Keep in mind cost and safety implications of enabling a more capable model for all clients.
