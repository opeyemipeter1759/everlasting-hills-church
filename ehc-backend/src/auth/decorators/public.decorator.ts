import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Marks a route as public — JwtAuthGuard will skip it.
 * Use sparingly. Default posture is "auth required".
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

export const OPTIONAL_AUTH_KEY = 'optionalAuth';

/**
 * Public route that ALSO reads the user when a valid token is sent. Anonymous
 * requests still pass; `@CurrentUser()` is then undefined. A missing, expired or
 * invalid token is treated as anonymous — never a 401 — so public pages keep working.
 */
export const OptionalAuth = () => (target: object, key?: string | symbol, descriptor?: PropertyDescriptor) => {
  SetMetadata(IS_PUBLIC_KEY, true)(target, key as string, descriptor as PropertyDescriptor);
  SetMetadata(OPTIONAL_AUTH_KEY, true)(target, key as string, descriptor as PropertyDescriptor);
};
