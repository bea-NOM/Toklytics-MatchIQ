/**
 * Lightweight controls for GPT-5 rollout: sampling and basic rate-limiting.
 * This is an in-memory demo implementation. Replace with Redis/etc. for production.
 */
import { isGpt5Enabled } from '../../config/feature-flags';

const REQUEST_COUNTS = new Map<string, { count: number; resetAt: number }>();

export function isGpt5AvailableForUser(userId?: string, percent = 5): boolean {
  // If feature flag denies globally, return false
  if (!isGpt5Enabled()) return false;

  // If no userId, only enable for internal/testing when percent === 100
  if (!userId) return percent === 100;

  // Simple deterministic sampling based on userId hash
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash << 5) - hash + userId.charCodeAt(i);
    hash |= 0; // convert to 32bit
  }
  const bucket = Math.abs(hash) % 100;
  return bucket < percent;
}

export function recordGpt5Request(key = 'global', limit = 100, windowMs = 60_000) {
  const now = Date.now();
  const entry = REQUEST_COUNTS.get(key) || { count: 0, resetAt: now + windowMs };
  if (now > entry.resetAt) {
    entry.count = 0;
    entry.resetAt = now + windowMs;
  }
  entry.count++;
  REQUEST_COUNTS.set(key, entry);
  return entry.count <= limit;
}

export function getGpt5Usage(key = 'global') {
  const entry = REQUEST_COUNTS.get(key);
  return entry ? { count: entry.count, resetAt: entry.resetAt } : { count: 0, resetAt: 0 };
}
