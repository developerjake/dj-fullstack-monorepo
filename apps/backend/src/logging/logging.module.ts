import { Module } from '@nestjs/common';

import { PinoLoggingAdapter } from './logging.adapter';
import { LOGGING_ADAPTER } from './logging.constants';
import { LoggingService } from './logging.service';

@Module({
  providers: [
    LoggingService,
    {
      provide: LOGGING_ADAPTER,
      useClass: PinoLoggingAdapter,
    },
  ],
  exports: [LoggingService],
})
export class LoggingModule {}
