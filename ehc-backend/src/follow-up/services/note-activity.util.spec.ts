import { summariseActivity, threadKey } from './note-activity.util';

const at = (iso: string) => new Date(iso);
const note = (subjectId: string, authorId: string, iso: string) => ({ subjectKind: 'MEMBER', subjectId, authorId, createdAt: at(iso) });

describe('summariseActivity', () => {
  const notes = [
    note('ada', 'me', '2026-09-26T09:00:00Z'),
    note('ada', 'bola', '2026-09-26T10:00:00Z'),
    note('ada', 'bola', '2026-09-26T12:00:00Z'),
    note('tunde', 'bola', '2026-09-26T08:00:00Z'),
  ];

  it('counts every message logged, and only what others posted since you last looked as unread', () => {
    const reads = [{ subjectKind: 'MEMBER', subjectId: 'ada', lastReadAt: at('2026-09-26T11:00:00Z') }];
    const activity = summariseActivity(notes, reads, 'me');
    expect(activity.get(threadKey('MEMBER', 'ada'))).toEqual({ total: 3, unread: 1 });
  });

  it('treats a thread you have never opened as all unread, except your own messages', () => {
    const activity = summariseActivity(notes, [], 'me');
    expect(activity.get(threadKey('MEMBER', 'ada'))).toEqual({ total: 3, unread: 2 });
    expect(activity.get(threadKey('MEMBER', 'tunde'))).toEqual({ total: 1, unread: 1 });
  });

  it('has nothing unread once you have opened the thread after the last message', () => {
    const reads = [{ subjectKind: 'MEMBER', subjectId: 'ada', lastReadAt: at('2026-09-26T13:00:00Z') }];
    expect(summariseActivity(notes, reads, 'me').get(threadKey('MEMBER', 'ada'))).toEqual({ total: 3, unread: 0 });
  });

  it('keeps a member and a visitor with the same id apart', () => {
    const mixed = [note('x', 'bola', '2026-09-26T08:00:00Z'), { ...note('x', 'bola', '2026-09-26T08:00:00Z'), subjectKind: 'VISITOR' }];
    const activity = summariseActivity(mixed, [], 'me');
    expect(activity.get(threadKey('MEMBER', 'x'))?.total).toBe(1);
    expect(activity.get(threadKey('VISITOR', 'x'))?.total).toBe(1);
  });
});
