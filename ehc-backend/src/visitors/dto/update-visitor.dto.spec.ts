import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UpdateVisitorDto } from './update-visitor.dto';

const problems = async (body: Record<string, unknown>) =>
  (await validate(plainToInstance(UpdateVisitorDto, body))).flatMap((e) => Object.values(e.constraints ?? {}));

describe('UpdateVisitorDto heard-from rules', () => {
  it('needs the inviter when an edit sets Friend or Family, and the text when it sets Other', async () => {
    expect(await problems({ howDidYouLearn: 'Friend/Family' })).toContain('Tell us who invited them');
    expect(await problems({ howDidYouLearn: 'Other', heardFromOther: '' })).toContain('Tell us how they heard about us');
    expect(await problems({ howDidYouLearn: 'Friend/Family', invitedBy: 'Bisi' })).toEqual([]);
    expect(await problems({ howDidYouLearn: 'Other', heardFromOther: 'A radio advert' })).toEqual([]);
  });

  it('lets a legacy value save, and an edit to another field touches neither answer', async () => {
    expect(await problems({ howDidYouLearn: 'Online' })).toEqual([]);
    const edit = plainToInstance(UpdateVisitorDto, { firstName: 'Ada' });
    expect(await validate(edit)).toEqual([]);
    expect(edit.invitedBy).toBeUndefined();
    expect(edit.heardFromOther).toBeUndefined();
  });
});
