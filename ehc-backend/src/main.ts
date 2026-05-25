import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { validateEnv } from './config/env.validation';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AuthModule } from './auth/auth.module';
import { FormsModule } from './forms/forms.module';
import { SermonsModule } from './sermons/sermons.module';

async function bootstrap() {
  validateEnv(process.env);
  const app = await NestFactory.create(AppModule);
  const config = new DocumentBuilder()
    .setTitle('church-api')
    .setDescription('API documentation for EHC')
    .setVersion('0.0.1')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'access-token',
    )
    .build();

  // Limit scanning to the application's root module to avoid scanning
  // dynamically created internal modules that may lack route metadata.
  try {
    const document = SwaggerModule.createDocument(app, config, {
      include: [AppModule, AuthModule, FormsModule, SermonsModule],
    });
    SwaggerModule.setup('docs', app, document);
  }
  catch (err) {
    // Don't let swagger setup crash the application; log and continue.
    console.warn('Swagger setup failed, continuing without docs:', err  );
  }
  app.enableCors({
    origin: process.env.FRONTEND_URL ?? '*',
    credentials: true,
  });
  const port = Number(process.env.PORT) || 4000;
  await app.listen(port);
  console.log(`church-api running on http://localhost:${port}`);
}

void bootstrap();
