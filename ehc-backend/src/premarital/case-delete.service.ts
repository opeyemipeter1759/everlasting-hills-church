import { ConflictException, Injectable } from '@nestjs/common';
import type { AuthUser } from '../auth/types/auth-user';
import { parseSchema } from '../common/zod-parse.util';
import { PrismaService } from '../prisma/prisma.service';
import { CaseAccess, requireCan } from './case-access';
import { counsellingAudit } from './counselling-audit';
import { CoupleAccountsService } from './couple/couple-accounts.service';
import { DocumentStore } from './documents/document-storage';
import { deleteApplicationsSchema } from './premarital.schema';

/**
 * Deleting whole applications for good: the Pastor and Super Admins, from a
 * case or several at once from the list (test cases, mostly). Everything
 * attached goes with the case: sessions, notes, history, the documents
 * checklist, the stored files, and the dashboard sign-ins made for a couple
 * who are not members. A member's own account is never touched. One audit
 * line stays, saying who deleted which case, with no names.
 */
@Injectable()
export class CaseDeleteService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: CaseAccess,
    private readonly store: DocumentStore,
    private readonly accounts: CoupleAccountsService,
  ) {}

  async remove(actor: AuthUser, raw: unknown) {
    const ids = [...new Set(parseSchema(deleteApplicationsSchema, raw).ids)];
    // Every case is checked first, so a request holding one case this person
    // may not delete deletes nothing at all.
    for (const id of ids) requireCan((await this.access.open(actor, id)).tier, 'delete');
    let deleted = 0;
    let accountsRemoved = 0;
    for (const id of ids) {
      const one = await this.removeOne(actor, id);
      deleted += one.deleted;
      accountsRemoved += one.accountsRemoved;
    }
    return { deleted, accountsRemoved };
  }

  private async removeOne(actor: AuthUser, id: string) {
    const tenantId = this.access.tenantId;
    const files = await this.prisma.counsellingDocumentFile.findMany({
      where: { tenantId, purgedAt: null, Requirement: { applicationId: id } },
      select: { id: true, storageKey: true },
    });
    if (files.length && !this.store.configured)
      throw new ConflictException('Stored documents cannot be removed right now, so nothing was deleted. Please try again later.');
    // The files first: a case is never deleted while its documents are still stored.
    for (const f of files) {
      await this.store.remove(f.storageKey);
      await this.prisma.counsellingDocumentFile.update({ where: { id: f.id }, data: { purgedAt: new Date() } });
    }
    const couples = await this.prisma.counsellingParticipant.findMany({
      where: { tenantId, applicationId: id, accountKind: 'COUPLE' },
      select: { authUserId: true },
    });
    const deleted = await this.prisma.$transaction(async (tx) => {
      // The status history is append-only; this switch allows its rows to go with the case.
      await tx.$executeRawUnsafe(`SET LOCAL ehc.allow_append_only_purge = 'on'`);
      const { count } = await tx.counsellingApplication.deleteMany({ where: { id, tenantId } });
      if (count)
        await counsellingAudit(tx, { tenantId, actor, action: 'COUNSELLING_APPLICATION_DELETED', entity: 'CounsellingApplication', entityId: id });
      return count;
    });
    const accountsRemoved = await this.accounts.removeUnused(couples.map((c) => c.authUserId));
    return { deleted, accountsRemoved };
  }
}
