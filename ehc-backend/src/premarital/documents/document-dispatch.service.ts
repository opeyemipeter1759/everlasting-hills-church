import { Injectable, Logger } from '@nestjs/common';
import type { CounsellingApplication, CounsellingDispatchStatus, CounsellingParticipantSide, Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import {
  buildApplicantWelcomeEmail,
  buildDocumentsEmail,
  buildPartnerWelcomeEmail,
  buildSignInEmail,
  type SignIn,
} from '../../notifications/templates/counselling-documents.email';
import { PrismaService } from '../../prisma/prisma.service';
import { CaseAccess } from '../case-access';
import { CoupleAccountsService, type SignInPlan } from '../couple/couple-accounts.service';
import { DocumentLettersService } from './document-letters.service';
import { DocumentMailer, type MailOutcome } from './document-mailer';
import { lagosDay, REQUIREMENT_KINDS, roleOf } from './document-rules';

type Letters = Awaited<ReturnType<DocumentLettersService['lettersFor']>>;

const signInOf = (plan: SignInPlan): SignIn => ({ mode: plan.mode, phoneEnding: plan.phoneEnding, expires: plan.expires });

/**
 * The couple's emails about their dashboards and letters. After a new
 * application, each partner gets one email: how to sign in to their own
 * dashboard, with their own two letters attached (the consent letter for one
 * of their parents or a guardian to sign, and the medical screening letter
 * with the tests), each with their name. If the letters cannot be built, the
 * emails still go with the sign-in details, and the dispatch log shows the
 * failure so the office can resend. Nothing here can undo an application, and
 * nothing here throws.
 */
@Injectable()
export class DocumentDispatchService {
  private readonly logger = new Logger(DocumentDispatchService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly access: CaseAccess,
    private readonly letters: DocumentLettersService,
    private readonly mailer: DocumentMailer,
    private readonly accounts: CoupleAccountsService,
  ) {}

  /** Creates the checklist rows where missing, inside the caller's transaction. */
  async prepare(tx: Prisma.TransactionClient, app: Pick<CounsellingApplication, 'id'>): Promise<void> {
    const tenantId = this.access.tenantId;
    await tx.counsellingDocumentRequirement.createMany({
      data: REQUIREMENT_KINDS.map((kind) => ({ id: randomUUID(), tenantId, applicationId: app.id, kind })),
      skipDuplicates: true,
    });
  }

  /** Right after an application: each partner's welcome email with their own letters. Records the letters' outcome. */
  async welcome(app: CounsellingApplication, plans: SignInPlan[]): Promise<CounsellingDispatchStatus> {
    const issueDay = lagosDay(new Date());
    const sent: CounsellingParticipantSide[] = [];
    let first: Letters | null = null;
    let lettersFailed = false;
    let applicantOutcome: MailOutcome = { status: 'FAILED', messageId: null };
    for (const plan of plans) {
      if (plan.side === 'PARTNER' && plan.mode === 'FAILED') continue; // the office sends theirs once the account exists
      const built = await this.build(app, issueDay, plan.side);
      if (built) first ??= built;
      else lettersFailed = true;
      const letters = built ? { consentPdf: built.consent, medicalPdf: built.medical } : null;
      const base = { firstName: plan.firstName, email: plan.email, appUrl: this.mailer.appUrl, signIn: signInOf(plan), letters };
      const out = await this.mailer.send(
        app,
        plan.side === 'APPLICANT' ? (letters ? 'DOCUMENTS' : 'RECEIVED') : 'PARTNER_WELCOME',
        plan.side === 'APPLICANT' ? buildApplicantWelcomeEmail(base) : buildPartnerWelcomeEmail({ ...base, applicantFirstName: app.applicantFirstName }),
      );
      if (plan.side === 'APPLICANT') applicantOutcome = out;
      if (out.status === 'SENT' && plan.mode !== 'FAILED') sent.push(plan.side);
    }
    await this.accounts.markSent(app, sent).catch(() => undefined);

    const status: CounsellingDispatchStatus = lettersFailed || !first ? 'FAILED' : applicantOutcome.status;
    await this.record(app, first, issueDay, status, null, applicantOutcome.messageId);
    return status;
  }

  /** The office resends each partner their own letters, with how to sign in. */
  async send(app: CounsellingApplication, plans: SignInPlan[], requestedById: string | null): Promise<CounsellingDispatchStatus> {
    const issueDay = lagosDay(new Date());
    const outcomes: MailOutcome[] = [];
    let first: Letters | null = null;
    let lettersFailed = false;
    for (const plan of plans) {
      const built = await this.build(app, issueDay, plan.side);
      if (!built) {
        lettersFailed = true;
        continue;
      }
      first ??= built;
      outcomes.push(
        await this.mailer.send(
          app,
          'DOCUMENTS',
          buildDocumentsEmail({
            firstName: plan.firstName,
            email: plan.email,
            appUrl: this.mailer.appUrl,
            signIn: signInOf(plan),
            consentPdf: built.consent,
            medicalPdf: built.medical,
          }),
        ),
      );
    }
    const status: CounsellingDispatchStatus =
      lettersFailed || !outcomes.length || outcomes.some((x) => x.status === 'FAILED')
        ? 'FAILED'
        : outcomes.every((x) => x.status === 'SENT')
          ? 'SENT'
          : 'SKIPPED';
    await this.record(app, first, issueDay, status, requestedById, outcomes[0]?.messageId ?? null);
    return status;
  }

  /** The office resends how to sign in, to each partner who has an account. */
  async signIn(app: CounsellingApplication, plans: SignInPlan[]): Promise<MailOutcome['status']> {
    let worst: MailOutcome['status'] = 'SENT';
    const sent: CounsellingParticipantSide[] = [];
    for (const plan of plans) {
      if (plan.mode === 'FAILED') {
        worst = 'FAILED';
        continue;
      }
      const out = await this.mailer.send(
        app,
        'SIGN_IN',
        buildSignInEmail({ firstName: plan.firstName, email: plan.email, appUrl: this.mailer.appUrl, signIn: signInOf(plan) }),
      );
      if (out.status === 'SENT') sent.push(plan.side);
      else worst = out.status === 'FAILED' || worst === 'FAILED' ? 'FAILED' : 'SKIPPED';
    }
    await this.accounts.markSent(app, sent).catch(() => undefined);
    return worst;
  }

  /** One partner's letters, or null when they cannot be built (the reason is logged without details). */
  private async build(app: CounsellingApplication, issueDay: string, side: CounsellingParticipantSide): Promise<Letters | null> {
    try {
      const person = roleOf(app.applicantRole, side);
      if (!person) throw new Error('The applicant role is not set');
      return await this.letters.lettersFor(app, { issueDay, person });
    } catch (err) {
      this.logger.warn(`Could not build the counselling letters for application ${app.id}: ${(err as Error).name}`);
      return null;
    }
  }

  private async record(
    app: CounsellingApplication,
    built: Letters | null,
    issueDay: string,
    status: CounsellingDispatchStatus,
    requestedById: string | null,
    messageId: string | null,
  ) {
    await this.prisma.counsellingDocumentDispatch
      .create({
        data: {
          id: randomUUID(),
          tenantId: this.access.tenantId,
          applicationId: app.id,
          consentTemplateId: built?.consentTemplateId ?? null,
          medicalTemplateId: built?.medicalTemplateId ?? null,
          issueDate: new Date(`${issueDay}T00:00:00Z`),
          status,
          resendMessageId: messageId,
          requestedById,
        },
      })
      .catch((err: Error) => this.logger.warn(`Could not log a documents dispatch: ${err.name}`));
  }
}
