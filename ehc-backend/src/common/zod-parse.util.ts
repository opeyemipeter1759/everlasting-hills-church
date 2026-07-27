import { BadRequestException } from '@nestjs/common';
import { z } from 'zod';

/** Validates `raw` against a Zod schema, throwing a 400 with per-field details on failure. */
export function parseSchema<T>(schema: z.ZodType<T>, raw: unknown): T {
  const r = schema.safeParse(raw);
  if (!r.success) {
    throw new BadRequestException({
      message: 'Invalid input',
      details: r.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
    });
  }
  return r.data;
}
