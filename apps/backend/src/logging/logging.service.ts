import { Inject, Injectable } from '@nestjs/common';

import { LOGGING_ADAPTER } from './logging.constants';
import type { LogContext, LoggingAdapter } from './logging.types';

@Injectable()
export class LoggingService {
  public constructor(@Inject(LOGGING_ADAPTER) private readonly adapter: LoggingAdapter) {}

  public log(message: string, context?: LogContext) {
    this.adapter.log(message, context);
  }

  public warn(message: string, context?: LogContext) {
    this.adapter.warn(message, context);
  }

  public error(message: string, error?: Error, context?: LogContext) {
    this.adapter.error(message, error, context);
  }
}
