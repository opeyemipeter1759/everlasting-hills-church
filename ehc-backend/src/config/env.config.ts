import { ConfigService } from '@nestjs/config';
import type { Env } from './env.validation';

/**
 * Typed accessor for validated env config.
 *
 * Why: ConfigService<Env, true> tells NestJS "every key is guaranteed present" because
 * validateEnv() throws at boot if anything is missing. This eliminates `!` non-null assertions
 * and `process.env.X` reads scattered throughout services.
 */
export type TypedConfigService = ConfigService<Env, true>;
