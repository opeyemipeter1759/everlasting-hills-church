import { IS_PUBLIC_KEY } from '../auth/decorators/public.decorator';
import { DailyScriptureController } from './daily-scripture.controller';

describe('DailyScriptureController access', () => {
  it("makes today's scripture and its translation list public", () => {
    expect(
      Reflect.getMetadata(
        IS_PUBLIC_KEY,
        DailyScriptureController.prototype.today,
      ),
    ).toBe(true);
    expect(
      Reflect.getMetadata(
        IS_PUBLIC_KEY,
        DailyScriptureController.prototype.translations,
      ),
    ).toBe(true);
  });
});
