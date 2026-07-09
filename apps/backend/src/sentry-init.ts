import * as Sentry from '@sentry/nestjs';

// What percentage (%) of traces to sample from 0 to 1.
const defaultTracesSampleRate = process.env.NODE_ENV === 'production' ? 0.2 : 1;
const parsed = Number(process.env.SENTRY_TRACES_SAMPLE_RATE?.trim() ?? defaultTracesSampleRate);
const tracesSampleRate = Number.isFinite(parsed)
  ? Math.min(1, Math.max(0, parsed))
  : defaultTracesSampleRate;

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.SENTRY_ENVIRONMENT?.trim() || process.env.NODE_ENV,
  release: process.env.SENTRY_RELEASE?.trim() || undefined,
  tracesSampleRate,
  // Opt in explicitly if you need default PII (e.g. IP) on events.
  sendDefaultPii: process.env.SENTRY_SEND_DEFAULT_PII === 'true',
});

/** True when SENTRY_DSN is set; used for startup observability logs only. */
export const sentryEnabled = Boolean(process.env.SENTRY_DSN?.trim());
