export function captureException(err: unknown, meta?: Record<string, unknown>) {
  // Lightweight no-op monitoring wrapper. In prod, set MONITORING_DSN and implement.
  try {
    if (process.env.MONITORING_DSN) {
      // placeholder: integrate with Sentry or other monitoring SDK
      // e.g., Sentry.captureException(err, { extra: meta })
      console.warn('[monitoring] would send exception', err, meta);
    } else {
      // Log to console for now
      console.error('[monitoring] exception', err, meta || {});
    }
  } catch (e) {
    // swallow
    console.error('[monitoring] failed to capture exception', e);
  }
}

export function captureMessage(message: string, meta?: Record<string, unknown>) {
  if (process.env.MONITORING_DSN) {
    console.info('[monitoring] would send message', message, meta);
  } else {
    console.info('[monitoring] message', message, meta || {});
  }
}
