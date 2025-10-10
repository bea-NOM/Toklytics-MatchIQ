import { callOpenAI, getModelName as getOpenAIModel } from './openai-client';
import { isGpt5AvailableForUser, recordGpt5Request } from './gpt5-controls';
import { isGpt5EnabledForUser } from '../../config/feature-flags';

/**
 * ai-client.ts
 * Wrapper that prefers a real OpenAI call when OPENAI_API_KEY is present,
 * otherwise falls back to a simulated response for local dev/test.
 */

export function getModelName(userId?: string): string {
  return getOpenAIModel(userId);
}

export async function callModel(prompt: string, opts?: { userId?: string }) {
  const userId = opts?.userId;

  // Decide if GPT-5 should be used for this user (guard + sampling)
  const guardAllows = isGpt5EnabledForUser(userId);
  const shouldUseGpt5 = guardAllows && isGpt5AvailableForUser(userId);

  // Basic rate limit: 100 reqs/min per global key
  if (!recordGpt5Request('global', 100, 60_000)) {
    throw new Error('Rate limit exceeded for GPT-5');
  }

  if (process.env.OPENAI_API_KEY && shouldUseGpt5) {
    // Call real OpenAI API
    const data = await callOpenAI(prompt);
    return {
      model: getModelName(userId),
      raw: data,
    };
  }

  // Fallback simulated response
  const model = getModelName(userId);
  return {
    model,
    input: prompt,
    output: `Simulated response from ${model} for prompt: ${prompt}`,
  };
}
