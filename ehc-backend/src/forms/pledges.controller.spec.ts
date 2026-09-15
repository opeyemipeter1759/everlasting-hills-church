import { IS_PUBLIC_KEY } from '../auth/decorators/public.decorator';
import { PledgesController } from './pledges.controller';

describe('PledgesController access', () => {
  it('makes only the dedicated public submission action unauthenticated', () => {
    const publicAction = Reflect.getMetadata(
      IS_PUBLIC_KEY,
      PledgesController.prototype.submitPublic,
    );
    const memberAction = Reflect.getMetadata(
      IS_PUBLIC_KEY,
      PledgesController.prototype.submit,
    );
    const adminAction = Reflect.getMetadata(
      IS_PUBLIC_KEY,
      PledgesController.prototype.list,
    );

    expect(publicAction).toBe(true);
    expect(memberAction).not.toBe(true);
    expect(adminAction).not.toBe(true);
  });
});
