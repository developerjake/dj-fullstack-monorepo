import { LoggerModule } from 'nestjs-pino';

import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { SentryModule } from '@sentry/nestjs/setup';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LoggingModule } from './logging/logging.module';
import { CustomHttpErrorFilter } from './http-exception-filter';
import { createPinoDestinationStream } from './pino-stream';

@Module({
  imports: [
    LoggingModule,
    LoggerModule.forRoot({
      forRoutes: ['/_pino_http'],
      pinoHttp: {
        autoLogging: true,
        level:
          process.env.LOG_LEVEL?.trim() ||
          (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
        stream: createPinoDestinationStream(),
      },
    }),
    SentryModule.forRoot(),
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_FILTER,
      useClass: CustomHttpErrorFilter,
    },
    AppService,
  ],
})
export class AppModule {}
