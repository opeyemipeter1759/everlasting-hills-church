/**
 * Loads .env into process.env BEFORE any module decorator is evaluated.
 *
 * Why this exists: JobsModule.forRoot() inspects process.env.REDIS_URL at the
 * moment AppModule's @Module decorator is constructed, which happens during
 * import — before Nest's ConfigModule has run. Importing this file first (it is
 * the very first import in app.module.ts) guarantees .env values are present
 * for that synchronous check. ConfigModule still re-reads .env afterwards; this
 * is a harmless, idempotent pre-load.
 */
import * as dotenv from 'dotenv';

dotenv.config();
