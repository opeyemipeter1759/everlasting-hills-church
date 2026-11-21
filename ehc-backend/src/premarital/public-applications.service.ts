import { ConflictException, Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { createHash, randomBytes, randomUUID } from 'crypto';
import { parseSchema } from '../common/zod-parse.util';
import { PrismaService } from '../prisma/prisma.service';
import { CaseAccess } from './case-access';
import { counsellingAudit } from './counselling-audit';
import { CoupleAccountsService } from './couple/couple-accounts.service';
import { DocumentDispatchService } from './documents/document-dispatch.service';
import {
  publicApplicationSchema,
  type PublicApplicationInput,
} from './premarital.schema';

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I: easy to read aloud

export function referenceCode(): string {
  return `PMC-${Array.from(randomBytes(6), (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join('')}`;
}

const digits = (v: string | null | undefined) =>
  (v ?? '').replace(/\D/g, '').slice(-10);

/** The same couple's contact details always hash the same, however they were typed. */
export function submissionHash(
  tenantId: string,
  v: Pick<
    PublicApplicationInput,
    'applicantEmail' | 'applicantPhone' | 'partnerEmail' | 'partnerPhone'
  >,
): string {
  const parts = [
    tenantId,
    v.applicantEmail.trim().toLowerCase(),
    digits(v.applicantPhone),
    (v.partnerEmail ?? '').trim().toLowerCase(),
    digits(v.partnerPhone),
  ];
  return createHash('sha256').update(parts.join('|')).digest('hex');
}

const isUniqueViolation = (err: unknown) =>
  err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002';

/**
 * The public application. Saved before the answer goes back. A retry of the
 * same form (same submissionKey) or the same couple applying again while their
 * case is still open gets the same success answer and no second case. A bot
 * that fills the honeypot gets a success answer and nothing is kept. The answer
 * carries a reference only, never anything the couple wrote.
 */
@Injectable()
export class PublicApplicationsService {
  private readonly logger = new Logger(PublicApplicationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly access: CaseAccess,
    private readonly dispatch: DocumentDispatchService,
    private readonly accounts: CoupleAccountsService,
  ) {}

  async submit(raw: unknown): Promise<{ referenceCode: string }> {
    const input = parseSchema(publicApplicationSchema, raw);
    if (input.website && input.website.trim()) {
      this.logger.warn({ msg: 'pre-marital application honeypot tripped' });
      return { referenceCode: referenceCode() };
    }
    const tenantId = this.access.tenantId;
    const hash = submissionHash(tenantId, input);
    const existing = await this.findExisting(
      tenantId,
      input.submissionKey,
      hash,
    );
    if (existing) return { referenceCode: existing };

    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const app = await this.prisma.$transaction(async (tx) => {
          const created = await tx.counsellingApplication.create({
            data: {
              id: randomUUID(),
              tenantId,
              referenceCode: referenceCode(),
              submissionKey: input.submissionKey,
              submissionHash: hash,
              applicantFirstName: input.applicantFirstName,
              applicantLastName: input.applicantLastName,
              applicantEmail: input.applicantEmail,
              applicantPhone: input.applicantPhone,
              partnerFirstName: input.partnerFirstName,
              partnerLastName: input.partnerLastName,
              partnerEmail: input.partnerEmail,
              partnerPhone: input.partnerPhone,
              partnerConsentToContact: true,
              membership: input.membership,
              weddingDate: input.weddingDate
                ? new Date(`${input.weddingDate}T00:00:00Z`)
                : null,
              preferredContact: input.preferredContact,
              intro: input.intro || null,
              privacyAcknowledgedAt: new Date(),
              applicantRole: input.applicantRole,
            },
          });
          await tx.counsellingStatusEvent.create({
            data: {
              id: randomUUID(),
              tenantId,
              applicationId: created.id,
              fromStatus: null,
              toStatus: 'SUBMITTED',
              actorProfileId: null,
            },
          });
          await counsellingAudit(tx, {
            tenantId,
            actor: null,
            action: 'COUNSELLING_SUBMITTED',
            entity: 'CounsellingApplication',
            entityId: created.id,
          });
          // The document checklist, with the application.
          await this.dispatch.prepare(tx, created);
          return created;
        });
        // After the application is safe: each partner's dashboard sign-in,
        // then one email each (the applicant's carries the two letters).
        // Neither can fail the application; the office can resend both.
        await this.accounts
          .provision(app)
          .then((plans) => this.dispatch.welcome(app, plans))
          .catch((err: Error) => this.logger.error(`Welcome emails for counselling application ${app.id} failed: ${err.message}`));
        return { referenceCode: app.referenceCode };
      } catch (err) {
        if (!isUniqueViolation(err)) throw err;
        const same = await this.findExisting(
          tenantId,
          input.submissionKey,
          hash,
        );
        if (same) return { referenceCode: same };
        // Otherwise only the reference code collided: try again with a new one.
      }
    }
    throw new ConflictException(
      'Your application could not be saved. Please try again.',
    );
  }

  /** A case this submission repeats: the same form sent again, or the same couple's open case. */
  private async findExisting(
    tenantId: string,
    submissionKey: string,
    hash: string,
  ): Promise<string | null> {
    const row = await this.prisma.counsellingApplication.findFirst({
      where: {
        tenantId,
        OR: [
          { submissionKey },
          {
            submissionHash: hash,
            archivedAt: null,
            status: { notIn: ['COMPLETED', 'CLOSED'] },
          },
        ],
      },
      select: { referenceCode: true },
    });
    return row?.referenceCode ?? null;
  }
}
