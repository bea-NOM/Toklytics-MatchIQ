import { callOpenAI, getModelName as getOpenAIModel } from './openai-client';
import { isGpt5AvailableForUser, recordGpt5Request } from './gpt5-controls';

/**
 * ai-client.ts
 * Wrapper that prefers a real OpenAI call when OPENAI_API_KEY is present,
 * otherwise falls back to a simulated response for local dev/test.
 */

export function getModelName(): string {
  return getOpenAIModel();
}

export async function callModel(prompt: string, opts?: { userId?: string }) {
  const userId = opts?.userId;

  // Decide if GPT-5 should be used for this user (sampling & guard inside)
  const shouldUseGpt5 = isGpt5AvailableForUser(userId);

  // Basic rate limit: 100 reqs/min per global key
  if (!recordGpt5Request('global', 100, 60_000)) {
    throw new Error('Rate limit exceeded for GPT-5');
  }

  if (process.env.OPENAI_API_KEY && shouldUseGpt5) {
    // Call real OpenAI API
    const data = await callOpenAI(prompt);
    return {
      model: getModelName(),
      raw: data,
    };
  }

  // Fallback simulated response
  const model = getModelName();
  return {
    model,
    input: prompt,
    output: `Simulated response from ${model} for prompt: ${prompt}`,
  };
}
