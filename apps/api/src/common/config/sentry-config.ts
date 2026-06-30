/**
 * Sentry Error Tracking Configuration
 *
 * Enable by setting SENTRY_DSN environment variable.
 * In production: SENTRY_DSN=https://xxx@oxxx.ingest.sentry.io/xxx
 */

export function isSentryEnabled(): boolean {
  return !!process.env.SENTRY_DSN && !!process.env.SENTRY_DSN.startsWith('https://');
}

export function getSentryConfig() {
  return {
    dsn: process.env.SENTRY_DSN || '',
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE ?? '0.1'),
  };
}
