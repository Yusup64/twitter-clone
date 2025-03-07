// src/main.ts

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  const config = new DocumentBuilder()
    .setTitle('Twitter API')
    .setDescription('The Median API description')
    .setVersion('0.1')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        in: 'header',
      },
      'access-token',
    )
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: ['Authorization', 'Content-Type', 'Accept'],
  });

  const configService = app.get(ConfigService);
  const port =
    process.env.SERVER_PORT || configService.get<number>('SERVER_PORT', 8080);
  const host = configService.get<string>('HOST', '0.0.0.0');

  await app.listen(port, host);
  Logger.debug(`Server is running at http://${host}:${port}`);
  Logger.debug(`Ngrok proxy address: ${process.env.API_BASE_URL || 'Not set'}`);
}
bootstrap();
