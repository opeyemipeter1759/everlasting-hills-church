/**
 * One-off repair: Follow Up chat left behind on first-timers who were converted
 * to members before conversion started moving it (see moveFollowUpThread).
 *
 * Moves each converted visitor's messages, status requests and read markers to
 * the member they became, one transaction per person.
 *
 *   npx ts-node --transpile-only scripts/move-converted-visitor-threads.ts           # dry run: counts only
 *   npx ts-node --transpile-only scripts/move-converted-visitor-threads.ts --apply   # moves them
 *
 * Safe to re-run: once moved, a visitor has nothing left to move.
 */
import { PrismaClient } from '@prisma/client';
import { moveFollowUpThread } from '../src/follow-up/services/follow-up-subject.util';

async function main() {
  const apply = process.argv.includes('--apply');
  const prisma = new PrismaClient();
  try {
    const stranded = await prisma.$queryRaw<{ tenantId: string; visitorId: string; memberId: string; messages: bigint }[]>`
      SELECT v."tenantId" AS "tenantId", v.id AS "visitorId", v."convertedToMemberId" AS "memberId",
             (SELECT COUNT(*) FROM "FollowUpNote" n WHERE n."subjectKind" = 'VISITOR' AND n."subjectId" = v.id) AS messages
      FROM "Visitor" v
      WHERE v."convertedToMemberId" IS NOT NULL
        AND (EXISTS (SELECT 1 FROM "FollowUpNote" n WHERE n."subjectKind" = 'VISITOR' AND n."subjectId" = v.id)
          OR EXISTS (SELECT 1 FROM "FollowUpStatusChange" s WHERE s."subjectKind" = 'VISITOR' AND s."subjectId" = v.id)
          OR EXISTS (SELECT 1 FROM "FollowUpNoteRead" r WHERE r."subjectKind" = 'VISITOR' AND r."subjectId" = v.id))`;

    console.log(`${stranded.length} converted first-timer(s) with a thread left behind${apply ? '' : ' (dry run — pass --apply to move)'}`);
    let total = { notes: 0, statusChanges: 0, reads: 0 };
    for (const row of stranded) {
      if (!apply) {
        console.log(`  would move ${Number(row.messages)} message(s): visitor ${row.visitorId.slice(0, 8)}… → member ${row.memberId.slice(0, 8)}…`);
        continue;
      }
      const moved = await prisma.$transaction((tx) =>
        moveFollowUpThread(tx, row.tenantId, { kind: 'VISITOR', id: row.visitorId }, { kind: 'MEMBER', id: row.memberId }),
      );
      total = { notes: total.notes + moved.notes, statusChanges: total.statusChanges + moved.statusChanges, reads: total.reads + moved.reads };
      console.log(`  moved ${moved.notes} message(s), ${moved.statusChanges} status request(s), ${moved.reads} read marker(s) → member ${row.memberId.slice(0, 8)}…`);
    }
    if (apply) console.log(`done: ${total.notes} messages, ${total.statusChanges} status requests, ${total.reads} read markers`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
