import { FEATURE_FLAGS } from '../../config/feature-flags';
import { callOpenAI, getModelName as getOpenAIModel } from './openai-client';

/**
 * ai-client.ts
 * Wrapper that prefers a real OpenAI call when OPENAI_API_KEY is present,
 * otherwise falls back to a simulated response for local dev/test.
 */

export function getModelName(): string {
  return getOpenAIModel();
}

export async function callModel(prompt: string) {
  if (process.env.OPENAI_API_KEY) {
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
