import type { Response } from 'express';

import { ArgumentsHost, Catch, HttpStatus, type HttpServer } from '@nestjs/common';
import type { AbstractHttpAdapter } from '@nestjs/core/adapters';
import { MESSAGES } from '@nestjs/core/constants';
import { SentryGlobalFilter } from '@sentry/nestjs/setup';

@Catch()
export class CustomHttpErrorFilter extends SentryGlobalFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    if (host.getType() === 'http') {
      const res = host.switchToHttp().getResponse<Response>();
      if (res && typeof res === 'object') {
        const err = exception instanceof Error ? exception : new Error(String(exception));
        (res as { err?: Error }).err = err;
      }
    }
    // capture the error in Sentry
    super.catch(exception, host);
  }

  /**
   * Copy of Nest `BaseExceptionFilter.handleUnknownError` (@nestjs/core/exceptions/base-exception-filter.js)
   * but without the trailing `BaseExceptionFilter.logger.error(exception)` (upstream lines 51–53).
   * That Nest log duplicated every unknown error next to the pino-http access log once `res.err` is set.
   */
  handleUnknownError(
    exception: unknown,
    host: ArgumentsHost,
    applicationRef: AbstractHttpAdapter | HttpServer,
  ) {
    const body = this.isHttpError(exception) ? toHttpErrorBody(exception) : unknownServerException;

    const response = host.getArgByIndex<Response>(1);

    if (!applicationRef.isHeadersSent(response)) {
      applicationRef.reply(response, body, body.statusCode);
    } else {
      applicationRef.end(response);
    }
  }
}

const unknownServerException = {
  statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
  message: MESSAGES.UNKNOWN_EXCEPTION_MESSAGE,
};

type HttpError = {
  statusCode: number;
  message: string;
};

const toHttpErrorBody = (exception: HttpError) => ({
  statusCode: exception.statusCode,
  message: exception.message,
});
