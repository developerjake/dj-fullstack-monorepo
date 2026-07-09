export type LogContext = Record<string, unknown>;

export interface LoggingAdapter {
  log(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  error(message: string, error?: Error, context?: LogContext): void;
}
