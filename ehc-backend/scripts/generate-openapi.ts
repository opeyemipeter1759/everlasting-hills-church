import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { NestFactory } from '@nestjs/core';
import { createOpenApiDocument } from '../src/openapi/openapi-document';

const backendRoot = resolve(__dirname, '..');

// ConfigModule and the early load-env shim both look for `.env` in cwd. Run from
// the scripts directory so local credentials cannot influence the generated
// artifact or enable optional providers.
process.chdir(__dirname);

// The document generator constructs Nest's dependency graph but deliberately
// never calls app.init() or app.listen(). These syntactically valid placeholders
// satisfy config validation; no database, Supabase, Redis, or HTTP connection is
// opened while generating the contract.
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://openapi:openapi@127.0.0.1:5432/openapi';
process.env.DIRECT_URL = 'postgresql://openapi:openapi@127.0.0.1:5432/openapi';
process.env.SUPABASE_URL = 'https://example.supabase.co';
process.env.SUPABASE_ANON_KEY = 'openapi-placeholder';
process.env.DEFAULT_TENANT_ID = 'ehc_openapi';
process.env.CMS_PREVIEW_SECRET = 'openapi-preview-secret-at-least-32-characters';
process.env.CMS_REVALIDATE_SECRET =
  'openapi-revalidation-secret-at-least-32-characters';
// Prevent a developer's optional integrations from changing module discovery or
// trying to initialise instrumentation during this offline command.
delete process.env.REDIS_URL;
delete process.env.SENTRY_DSN;

async function generate(): Promise<void> {
  // Require is intentionally delayed until after the placeholder environment is
  // installed; AppModule loads ConfigModule and JobsModule at import time.
  const { AppModule } = require('../src/app.module') as typeof import('../src/app.module');
  const app = await NestFactory.create(AppModule, {
    abortOnError: true,
    logger: false,
  });

  try {
    const document = createOpenApiDocument(app);
    const outputPath = resolve(backendRoot, 'openapi', 'openapi.json');
    await mkdir(dirname(outputPath), { recursive: true });
    await writeFile(
      outputPath,
      `${JSON.stringify(sortKeys(document), null, 2)}\n`,
      'utf8',
    );
  } finally {
    await app.close();
  }
}

function sortKeys<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => sortKeys(item)) as T;
  }
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, item]) => [key, sortKeys(item)]),
    ) as T;
  }
  return value;
}

void generate().catch((error: unknown) => {
  const message = error instanceof Error ? error.stack : String(error);
  process.stderr.write(`OpenAPI generation failed: ${message}\n`);
  process.exitCode = 1;
});
