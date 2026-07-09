/*
  Pino is JSON logger for NodeJS.
  https://github.com/pinojs/pino
  It's very lightweight and fast.
*/
import pino from 'pino';
import pinoPretty from 'pino-pretty';

import type { DestinationStream } from 'pino';

import { HTTP_ACCESS_METADATA_KEY } from './http-serializers';

/**
 * Parse Loki headers from .env.
 * Expects a JSON object, for example:
 * ```
 * {
 *  "Content-Type": "application/json",
 *  "Authorization": "Bearer <token>",
 *  "X-Scope-OrgID": "1",
 *  ...
 * }
 * ```
 */
const parseLokiHeaders = (): Record<string, string> | undefined => {
  const raw = process.env.LOKI_HEADERS?.trim();
  if (!raw) {
    return undefined;
  }
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, string>;
    }
  } catch {
    return undefined;
  }
  return undefined;
};

/** True when LOKI_URL is set; matches createPinoDestinationStream gating. */
export const lokiEnabled = Boolean(process.env.LOKI_URL?.trim());

/** Stream logs to both stdout and Loki (if configured in .env) */
export const createPinoDestinationStream = (): DestinationStream => {
  const pretty = pinoPretty({
    colorize: true,
    destination: 1,
    ignore: `hostname,${HTTP_ACCESS_METADATA_KEY}`,
    translateTime: 'SYS:standard',
  });

  const lokiHost = process.env.LOKI_URL?.trim();
  if (!lokiHost) {
    return pretty;
  }

  const username = process.env.LOKI_USERNAME?.trim();
  const password = process.env.LOKI_WRITE_API_KEY?.trim();
  const basicAuth =
    username !== undefined && username !== '' && password !== undefined && password !== ''
      ? { username, password }
      : undefined;

  const lokiTransport = pino.transport({
    target: 'pino-loki',
    options: {
      host: lokiHost,
      basicAuth,
      headers: parseLokiHeaders(),
      labels: {
        env: process.env.NODE_ENV ?? 'development',
        ...(process.env.LOKI_SERVICE_NAME?.trim() && {
          service: process.env.LOKI_SERVICE_NAME.trim(),
        }),
      },
      structuredMetaKey: HTTP_ACCESS_METADATA_KEY,
    },
  });

  return pino.multistream([
    { level: 'trace', stream: pretty },
    { level: 'trace', stream: lokiTransport },
  ]);
};
