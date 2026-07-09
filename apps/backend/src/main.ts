import './load-env';
import './sentry-init';

import { NestFactory } from '@nestjs/core';
import { Logger, PinoLogger } from 'nestjs-pino';

import pinoHttp from 'pino-http';

import { AppModule } from './app.module';
import {
  toLogLevel,
  httpErrorMapping,
  httpSuccessMapping,
  httpErrorMessage,
  pinoHttpSerializers,
  httpSuccessMessage,
} from './http-serializers';
import { lokiEnabled } from './pino-stream';
import { sentryEnabled } from './sentry-init';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  const shutdown = async () => {
    try {
      await app?.close();
    } finally {
      process.exit(0);
    }
  };

  app.useLogger(app.get(Logger));
  const pinoLogger = await app.resolve(PinoLogger);
  app.use(
    pinoHttp({
      autoLogging: true,
      logger: pinoLogger.logger,
      serializers: pinoHttpSerializers,
      quietResLogger: true,
      customLogLevel: toLogLevel,
      customSuccessMessage: httpSuccessMessage,
      customSuccessObject: httpSuccessMapping,
      customErrorMessage: httpErrorMessage,
      customErrorObject: httpErrorMapping,
    }),
  );

  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  });

  app.setGlobalPrefix('api');

  const port = process.env.PORT ?? 3000;

  await app.listen(port);

  const logger = app.get(Logger);

  logger.log(`App listening on port ${port}`, 'Bootstrap');
  logger.log(`Observability — Sentry: ${sentryEnabled ? 'enabled' : 'disabled'}`, 'Bootstrap');
  logger.log(`Observability — Loki: ${lokiEnabled ? 'enabled' : 'disabled'}`, 'Bootstrap');

  process.once('SIGINT', () => void shutdown());
  process.once('SIGTERM', () => void shutdown());
}

void bootstrap();
