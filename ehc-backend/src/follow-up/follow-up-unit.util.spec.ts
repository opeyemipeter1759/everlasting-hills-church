import { isFollowUpUnitName } from './follow-up-unit.util';

/**
 * The unit name is typed by an admin. An exact 'Follow-Up' match found nothing
 * for a unit actually called "Follow up", which emptied the assignee picker
 * and hid the Report and Pending tabs from its own lead.
 */
describe('isFollowUpUnitName', () => {
  it.each([
    'Follow-Up',
    'Follow Up',
    'follow up',
    'FOLLOW UP ',
    'Followup',
    'Follow Up Unit',
    'Follow-up Team',
  ])('recognises %j', (name) => {
    expect(isFollowUpUnitName(name)).toBe(true);
  });

  it.each(['Follow', 'Up', 'Ushering', 'Audio Production', ''])('rejects %j', (name) => {
    expect(isFollowUpUnitName(name)).toBe(false);
  });
});
