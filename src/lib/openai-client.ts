import { isGpt5EnabledForUser } from '../../config/feature-flags';

/**
 * Minimal OpenAI client using fetch so we don't add new dependencies.
 * This calls the Responses API. Update the endpoint or payload if your account
 * requires the Chat Completions or a different API surface.
 */
export function getModelName(userId?: string): string {
  if (isGpt5EnabledForUser(userId)) return 'gpt-5-preview';
  return 'gpt-4o-mini';
}

export async function callOpenAI(prompt: string) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not set');
  }

  const model = getModelName();

  const res = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, input: prompt }),
  });

  let data;
  try {
    data = await res.json();
  } catch (err) {
    throw new Error(`OpenAI response parse failed: ${String(err)}`);
  }

  if (!res.ok) {
    const msg = data?.error?.message || JSON.stringify(data);
    throw new Error(`OpenAI API error: ${msg}`);
  }

  return data;
}
