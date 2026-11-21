import { SetMetadata } from '@nestjs/common';

export const ALLOW_COUPLE_ACCOUNT_KEY = 'allowCoupleAccount';

/**
 * A sign-in with no Profile (the pre-marital couple dashboard's accounts) may
 * reach this route. Every other route refuses such a sign-in (RolesGuard), so
 * a couple account can never wander into member, unit or staff pages, even
 * where a route checks nothing beyond "signed in".
 */
export const AllowCoupleAccount = () => SetMetadata(ALLOW_COUPLE_ACCOUNT_KEY, true);
