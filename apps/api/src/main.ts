import 'reflect-metadata';
import { existsSync, mkdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { setupSwagger } from './swagger-setup';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ResponseFormatInterceptor } from './common/interceptors/response-format.interceptor';
import { GlobalExceptionFilter } from './common/filters';
import { API_VERSIONING_CONFIG } from './common/api-versioning';
import { buildCorsOptions } from './common/config/cors-config';
import { helmetMiddleware } from './common/config/helmet-config';
import { GracefulShutdownService } from './common/shutdown/graceful-shutdown.service';
import { EnvValidatorService } from './common/config/env-validator.service';
import { SocketGateway } from './socket/socket.gateway';
let APP_VERSION = '0.0.0';
try {
  APP_VERSION = JSON.parse(readFileSync(join(__dirname, '../../../package.json'), 'utf-8')).version || '0.0.0';
} catch { /* fallback */ }

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { logger: ['error', 'warn', 'log'] });

  // CSRF is NOT needed — API uses JWT Bearer tokens (stateless auth).
  // CSRF only applies to cookie/session-based authentication.

  app.enableCors(buildCorsOptions());
  app.use(helmetMiddleware);
  app.enableVersioning(API_VERSIONING_CONFIG);
  const uploadsDir = join(process.cwd(), 'uploads');
  if (!existsSync(uploadsDir)) mkdirSync(uploadsDir, { recursive: true });
  app.useStaticAssets(uploadsDir, { prefix: '/uploads/' });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalInterceptors(new ResponseFormatInterceptor());
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Validate environment
  const envIssues = new EnvValidatorService().validate();
  for (const issue of envIssues) {
    console.warn(`[EnvValidator] ${issue}`);
  }

  // Graceful shutdown with WebSocket notification
  const shutdownService = new GracefulShutdownService();
  shutdownService.registerShutdown(app.getHttpServer());
  try {
    const wsGateway = app.get(SocketGateway);
    shutdownService.setNotifyClients(() => wsGateway.notifyShutdown());
  } catch {
    // SocketGateway may not be available if SocketModule is not loaded
  }

  setupSwagger(app, APP_VERSION);

  const port = process.env.PORT ?? 3000;
  
  app.enableShutdownHooks();
  
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);

  if (process.env.NODE_ENV !== 'production') {
    console.log(`Swagger docs: http://localhost:${port}/api`);
  }
}
bootstrap();
