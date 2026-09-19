import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.set('trust proxy', 1); // корректный IP за балансировщиком
  app.use(helmet());
  app.enableCors({ origin: (process.env.WEB_ORIGIN ?? 'http://localhost:3000').split(','), credentials: true });
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  app.enableShutdownHooks();

  if (process.env.NODE_ENV !== 'production') {
    const doc = new DocumentBuilder().setTitle('SoyleUp API').setVersion('0.1.0').addBearerAuth().build();
    SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, doc));
  }

  const port = Number(process.env.PORT ?? 3001);
  await app.listen(port);
  Logger.log(`API: http://localhost:${port}/api/v1  Docs: http://localhost:${port}/api/docs`, 'Bootstrap');
}

bootstrap();
