import type { IncomingMessage, ServerResponse } from 'node:http';

/** Rich access metadata for Loki / JSON sinks; hidden from dev terminal via pino-pretty `ignore`. */
export const HTTP_ACCESS_METADATA_KEY = 'http';

const requestPath = (req: RequestWithRoute) =>
  typeof req.originalUrl === 'string' ? req.originalUrl : (req.url ?? '');

const formatReqId = (id: RequestWithRoute['id']) => {
  if (id === undefined) {
    return '?';
  }
  if (typeof id === 'object') {
    return JSON.stringify(id);
  }
  return String(id);
};

const readResponseTime = (val: unknown): number => {
  if (!val || typeof val !== 'object') {
    return 0;
  }
  const n = Number((val as { responseTime?: unknown }).responseTime);
  return Number.isFinite(n) ? n : 0;
};

/** pino-http creates this when the response finishes with 5xx but no thrown Error was passed through. */
const SYNTHETIC_FAILED_WITH_STATUS = /^failed with status code \d+$/;

/** Returns `false` if the stack frame is not from this app’s source code. */
const isAppCode = (line: string) => {
  if (line.includes('node_modules')) {
    return false;
  }
  if (line.includes('node:internal') || /\(\s*node:[^)]+\)/.test(line)) {
    return false;
  }
  const normalized = line.replace(/\\/g, '/');
  // paths under apps/backend/src or /src/
  return /\/(?:apps\/backend\/src|src)\/[^)\s]+\.(?:ts|tsx|js|jsx):\d+:\d+/.test(normalized);
};

const toAppStack = (stack: string | undefined) => {
  if (!stack) {
    return undefined;
  }
  const lines = stack.split('\n');
  const [first, ...rest] = lines;
  const kept = rest.filter((line) => isAppCode(line));
  if (kept.length === 0) {
    return first;
  }
  return [first, ...kept].join('\n');
};

/** Stack frames only (`at …`), app source — no leading `Error:` line (msg already carries the message). */
const appStackFramesOnly = (stack: string | undefined) => {
  if (!stack) {
    return undefined;
  }
  const lines = stack.split('\n').slice(1);
  const frames = lines.filter((line) => isAppCode(line));
  if (frames.length === 0) {
    return undefined;
  }
  return frames.join('\n');
};

/**
 * Access metadata for Loki (JSON line). The same key is stripped from dev stdout via pino-pretty
 * `ignore`, so the terminal stays a single message line.
 */
export const httpSuccessMapping = (req: RequestWithRoute, res: ServerResponse, val: unknown) => ({
  [HTTP_ACCESS_METADATA_KEY]: {
    id: formatReqId(req.id),
    method: req.method ?? '',
    path: requestPath(req),
    statusCode: res.statusCode,
    responseTime: readResponseTime(val),
  },
});

/**
 * Same as success: `http` for Loki, plus `stack` (app frames) for errors. No raw `err` object
 * (avoids enumerable copies like `xtra` on Error).
 */
export const httpErrorMapping = (
  req: RequestWithRoute,
  res: ServerResponse,
  error: Error,
  val: unknown,
) => {
  const base = {
    [HTTP_ACCESS_METADATA_KEY]: {
      id: formatReqId(req.id),
      method: req.method ?? '',
      path: requestPath(req),
      statusCode: res.statusCode,
      responseTime: readResponseTime(val),
      errorMessage: error.message,
    },
  };
  const stack = appStackFramesOnly(error.stack);
  if (stack === undefined || stack === '') {
    return base;
  }
  return { ...base, stack };
};

export const toLogLevel = (_req: RequestWithRoute, res: ServerResponse, error?: Error) => {
  const code = res.statusCode;
  if (error) return 'error';
  if (code !== undefined && code >= 500) return 'error';
  if (code !== undefined && code >= 400) return 'warn';
  return 'info';
};

export const pinoHttpSerializers = {
  req: (serializedReq: SerializedReq) => ({
    id: serializedReq.id,
    method: serializedReq.method,
    url: serializedReq.url,
  }),
  res: (serializedRes: SerializedRes) => ({
    statusCode: serializedRes.statusCode,
  }),
  err: (error: SerializedErr) => {
    const message = error.message ?? '';
    if (SYNTHETIC_FAILED_WITH_STATUS.test(message)) {
      return {
        message: error.message,
        type: error.type,
      };
    }
    const { raw, ...rest } = error;
    void raw;
    return {
      ...rest,
      stack: toAppStack(error.stack),
    };
  },
};

export const httpSuccessMessage = (
  req: RequestWithRoute,
  res: ServerResponse,
  responseTime: number,
) => {
  const id = formatReqId(req.id);
  const method = req.method ?? '?';
  const path = requestPath(req);
  const status = res.statusCode;
  const statusText = res.statusMessage;
  return `[ID ${id}] ${method} ${path} ${status} ${statusText} (${responseTime}ms)`;
};

export const httpErrorMessage = (req: RequestWithRoute, res: ServerResponse, error: Error) => {
  const id = formatReqId(req.id);
  const method = req.method ?? '?';
  const path = requestPath(req);
  const status = res.statusCode;
  return `[ID ${id}] ${method} ${path} ${status} ${error.message}`;
};

type SerializedReq = {
  id?: number | string;
  method?: string;
  url?: string;
};

type SerializedRes = {
  statusCode?: number | null;
};

type SerializedErr = {
  message?: string;
  raw?: unknown;
  stack?: string;
  type?: string;
};

type RequestWithRoute = IncomingMessage & {
  id?: number | string | object;
  originalUrl?: string;
};
