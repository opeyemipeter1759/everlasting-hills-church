import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { z } from 'zod';
import type { AuthUser } from '../auth/types/auth-user';
import { parseSchema } from '../common/zod-parse.util';
import { PrismaService } from '../prisma/prisma.service';
import { CaseAccess } from './case-access';
import { counsellingAudit } from './counselling-audit';

/**
 * Counselling policy that only the pastors can settle: who may apply, how long
 * it runs, fees, the counselling team, how long applications are kept, and the
 * privacy wording. Nothing here is invented in code: every value starts as
 * PENDING_PASTORAL_APPROVAL and the public page shows only APPROVED values
 * (the privacy notice is always shown, because the form needs it).
 */
export const PENDING = 'PENDING_PASTORAL_APPROVAL';
const item = z.object({
  value: z.string().trim().max(4000),
  state: z.enum([PENDING, 'APPROVED']),
});
export const policySchema = z.object({
  eligibility: item,
  duration: item,
  fees: item,
  counsellors: item,
  retention: item,
  privacyNotice: item,
});
export type Policy = z.infer<typeof policySchema>;
export type PolicyKey = keyof Policy;

const pending = (value = '') => ({ value, state: PENDING as typeof PENDING });

/** Draft wording for the pastors to approve or replace. */
export const DRAFT_PRIVACY_NOTICE = [
  'We ask for your names, contact details, membership status, wedding date (if you have one), how you would like us to contact you and a short introduction, so the pastoral team can review your application and arrange counselling.',
  'Only the pastors, the marriage ministry team and the counsellor assigned to you can see it. We never pass on what one of you tells us to the other without permission, and nothing you share is used to train or feed any software.',
  'You can ask to see, correct or delete your information at any time by contacting the church office. We handle your information in line with the Nigeria Data Protection Act 2023.',
].join('\n\n');

export const DEFAULT_POLICY: Policy = {
  eligibility: pending(),
  duration: pending(),
  fees: pending(),
  counsellors: pending(),
  retention: pending(),
  privacyNotice: pending(DRAFT_PRIVACY_NOTICE),
};

@Injectable()
export class PolicyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: CaseAccess,
  ) {}

  async get(): Promise<Policy> {
    const row = await this.prisma.counsellingSettings.findUnique({
      where: { tenantId: this.access.tenantId },
    });
    const parsed = policySchema.safeParse(row?.content);
    return parsed.success ? parsed.data : DEFAULT_POLICY;
  }

  /** The full policy with its approval states, for the pastors' settings page. */
  async forStaff(
    actor: AuthUser,
  ): Promise<{ policy: Policy; canEdit: boolean }> {
    const tier = this.access.requireStaff(actor, 'curriculum');
    return { policy: await this.get(), canEdit: tier === 'PASTOR' };
  }

  async save(actor: AuthUser, raw: unknown): Promise<Policy> {
    this.access.requireStaff(actor, 'settings');
    const policy = parseSchema(policySchema, raw);
    const tenantId = this.access.tenantId;
    await this.prisma.$transaction(async (tx) => {
      // The same row holds the documents settings: keep them.
      const row = await tx.counsellingSettings.findUnique({
        where: { tenantId },
        select: { content: true },
      });
      const content = {
        ...(row?.content && typeof row.content === 'object'
          ? (row.content as object)
          : {}),
        ...policy,
      } as Prisma.InputJsonValue;
      await tx.counsellingSettings.upsert({
        where: { tenantId },
        create: {
          id: randomUUID(),
          tenantId,
          content,
          updatedBy: actor.profileId ?? null,
        },
        update: {
          content,
          updatedBy: actor.profileId ?? null,
        },
      });
      await counsellingAudit(tx, {
        tenantId,
        actor,
        action: 'COUNSELLING_POLICY_UPDATED',
        entity: 'CounsellingSettings',
        entityId: tenantId,
      });
    });
    return policy;
  }

  /** What the public page may say: approved values only, plus the privacy notice. */
  async publicView() {
    const p = await this.get();
    const approved = (k: PolicyKey) =>
      p[k].state === 'APPROVED' && p[k].value ? p[k].value : null;
    return {
      eligibility: approved('eligibility'),
      duration: approved('duration'),
      fees: approved('fees'),
      counsellors: approved('counsellors'),
      retention: approved('retention'),
      privacyNotice: p.privacyNotice.value || DRAFT_PRIVACY_NOTICE,
    };
  }
}
