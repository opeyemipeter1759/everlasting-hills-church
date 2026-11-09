import { ConflictException } from '@nestjs/common';
import { currentSubject, moveFollowUpThread } from './follow-up-subject.util';
import { VisitorsService } from '../../visitors/visitors.service';

const VISITOR = { kind: 'VISITOR', id: 'v1' };
const MEMBER = { kind: 'MEMBER', id: 'm1' };

function threadDb(reads: { id: string; profileId: string; lastReadAt: Date }[], existing: Record<string, { id: string; lastReadAt: Date }> = {}) {
  return {
    followUpNote: { updateMany: jest.fn().mockResolvedValue({ count: 12 }) },
    followUpStatusChange: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
    followUpNoteRead: {
      findMany: jest.fn().mockResolvedValue(reads),
      findUnique: jest.fn(({ where }) => Promise.resolve(existing[where.profileId_subjectKind_subjectId.profileId] ?? null)),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };
}

describe('moving a first-timer’s Follow Up thread to their member record', () => {
  it('moves the messages and status requests from the visitor to the member', async () => {
    const db = threadDb([]);
    await expect(moveFollowUpThread(db as never, 't', VISITOR, MEMBER)).resolves.toEqual({ notes: 12, statusChanges: 1, reads: 0 });
    const expected = {
      where: { tenantId: 't', subjectKind: 'VISITOR', subjectId: 'v1' },
      data: { subjectKind: 'MEMBER', subjectId: 'm1' },
    };
    expect(db.followUpNote.updateMany).toHaveBeenCalledWith(expected);
    expect(db.followUpStatusChange.updateMany).toHaveBeenCalledWith(expected);
  });

  it('keeps one read marker per person, the later of the two', async () => {
    const early = new Date('2026-11-01'), late = new Date('2026-11-05');
    const db = threadDb(
      [
        { id: 'r-new', profileId: 'p-new', lastReadAt: early },
        { id: 'r-both', profileId: 'p-both', lastReadAt: late },
      ],
      { 'p-both': { id: 'r-member', lastReadAt: early } },
    );
    await moveFollowUpThread(db as never, 't', VISITOR, MEMBER);

    // Only on the visitor's thread: the marker simply moves.
    expect(db.followUpNoteRead.update).toHaveBeenCalledWith({ where: { id: 'r-new' }, data: { subjectKind: 'MEMBER', subjectId: 'm1' } });
    // On both: the member's marker takes the later time and the visitor's goes.
    expect(db.followUpNoteRead.update).toHaveBeenCalledWith({ where: { id: 'r-member' }, data: { lastReadAt: late } });
    expect(db.followUpNoteRead.delete).toHaveBeenCalledWith({ where: { id: 'r-both' } });
  });

  it('opens the member’s thread from a link that still names the converted visitor', async () => {
    const db = { visitor: { findFirst: jest.fn().mockResolvedValue({ convertedToMemberId: 'm1' }) } };
    await expect(currentSubject(db as never, 't', VISITOR)).resolves.toEqual(MEMBER);
  });

  it('leaves members, and first-timers not yet converted, as they are', async () => {
    const db = { visitor: { findFirst: jest.fn().mockResolvedValue({ convertedToMemberId: null }) } };
    await expect(currentSubject(db as never, 't', VISITOR)).resolves.toEqual(VISITOR);
    await expect(currentSubject(db as never, 't', MEMBER)).resolves.toEqual(MEMBER);
    expect(db.visitor.findFirst).toHaveBeenCalledTimes(1);
  });
});

describe('deleting a first-timer who has a Follow Up conversation', () => {
  function service(messages: number) {
    const prisma = {
      followUpNote: { count: jest.fn().mockResolvedValue(messages), deleteMany: jest.fn().mockReturnValue('notes') },
      followUpStatusChange: { deleteMany: jest.fn().mockReturnValue('status') },
      followUpNoteRead: { deleteMany: jest.fn().mockReturnValue('reads') },
      visitor: { deleteMany: jest.fn().mockReturnValue('visitor') },
      $transaction: jest.fn().mockResolvedValue([{}, {}, {}, { count: 1 }]),
    };
    return { svc: new VisitorsService(prisma as never, { get: () => 't' } as never), prisma };
  }

  it('refuses while their chat has messages, so the conversation is never stranded', async () => {
    const { svc, prisma } = service(3);
    await expect(svc.delete('v1')).rejects.toBeInstanceOf(ConflictException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('with force, deletes the record and its chat together', async () => {
    const { svc, prisma } = service(3);
    await expect(svc.delete('v1', true)).resolves.toEqual({ id: 'v1', deleted: true });
    expect(prisma.$transaction).toHaveBeenCalledWith(['notes', 'status', 'reads', 'visitor']);
  });

  it('deletes straight away when there is no chat', async () => {
    const { svc } = service(0);
    await expect(svc.delete('v1')).resolves.toEqual({ id: 'v1', deleted: true });
  });
});
