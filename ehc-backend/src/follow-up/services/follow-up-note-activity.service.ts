import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import type { Env } from '../../config/env.validation';
import { summariseActivity, threadKey, type ThreadActivity } from './note-activity.util';

/**
 * Who has read which activity thread, and the counts the Master List shows
 * beside each person: messages logged so far, and how many the viewer hasn't
 * seen yet.
 */
@Injectable()
export class FollowUpNoteActivityService {
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  /** The viewer has just seen everything on this thread. */
  async markRead(profileId: string, subjectKind: string, subjectId: string): Promise<void> {
    const now = new Date();
    await this.prisma.followUpNoteRead.upsert({
      where: { profileId_subjectKind_subjectId: { profileId, subjectKind, subjectId } },
      create: { id: randomUUID(), tenantId: this.tenantId, profileId, subjectKind, subjectId, lastReadAt: now },
      update: { lastReadAt: now },
    });
  }

  /**
   * Activity for each row on a Master List page, keyed by "KIND:id". Worked
   * out for the page only, so it costs the same however many people the
   * church has; a page is at most 200 people.
   */
  async forRows(
    rows: { kind: string; id: string }[],
    viewerProfileId: string | null,
  ): Promise<Map<string, ThreadActivity>> {
    if (rows.length === 0) return new Map();
    const ids = rows.map((r) => r.id);
    const [notes, reads] = await Promise.all([
      this.prisma.followUpNote.findMany({
        where: { tenantId: this.tenantId, subjectId: { in: ids } },
        select: { subjectKind: true, subjectId: true, authorId: true, createdAt: true },
      }),
      viewerProfileId
        ? this.prisma.followUpNoteRead.findMany({
            where: { tenantId: this.tenantId, profileId: viewerProfileId, subjectId: { in: ids } },
            select: { subjectKind: true, subjectId: true, lastReadAt: true },
          })
        : Promise.resolve([]),
    ]);
    // subjectId alone could match a member and a visitor sharing an id; the
    // key carries the kind, so only this page's exact people are counted.
    const wanted = new Set(rows.map((r) => threadKey(r.kind, r.id)));
    return summariseActivity(
      notes.filter((n) => wanted.has(threadKey(n.subjectKind, n.subjectId))),
      reads,
      viewerProfileId,
    );
  }
}
