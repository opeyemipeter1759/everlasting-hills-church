import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Marks a route as public — JwtAuthGuard will skip it.
 * Use sparingly. Default posture is "auth required".
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
