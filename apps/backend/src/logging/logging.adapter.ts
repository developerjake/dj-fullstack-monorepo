import { Injectable } from '@nestjs/common';

import { PinoLogger } from 'nestjs-pino';

import * as Sentry from '@sentry/nestjs';

import type { LogContext, LoggingAdapter } from './logging.types';

@Injectable()
export class PinoLoggingAdapter implements LoggingAdapter {
  private readonly sentryEnabled: boolean;

  public constructor(private readonly logger: PinoLogger) {
    this.sentryEnabled = Boolean(process.env.SENTRY_DSN);
  }

  public log(message: string, context?: LogContext) {
    this.logger.debug(context ?? {}, message);
  }

  public warn(message: string, context?: LogContext) {
    this.logger.warn(context ?? {}, message);
  }

  public error(message: string, error?: Error, context?: LogContext) {
    const errorContext = this.buildErrorContext(error, context);

    this.logger.error(errorContext, message);

    if (error && this.sentryEnabled) {
      Sentry.captureException(error, { extra: context });
    }
  }

  private buildErrorContext(error?: Error, context?: LogContext) {
    if (!error) {
      return context ?? {};
    }

    return {
      ...(context ?? {}),
      errorName: error.name,
      errorMessage: error.message,
      errorStack: error.stack,
    };
  }
}
