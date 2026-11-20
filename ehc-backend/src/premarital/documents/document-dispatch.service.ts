import { Injectable, Logger } from '@nestjs/common';
import type { CounsellingApplication, CounsellingDispatchStatus, CounsellingParticipantSide, Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import {
  buildApplicantWelcomeEmail,
  buildDocumentsEmail,
  buildPartnerWelcomeEmail,
  buildSignInEmail,
} from '../../notifications/templates/counselling-documents.email';
import { PrismaService } from '../../prisma/prisma.service';
import { CaseAccess } from '../case-access';
import { CoupleAccountsService, type SignInPlan } from '../couple/couple-accounts.service';
import { DocumentLettersService } from './document-letters.service';
import { DocumentMailer, type MailOutcome } from './document-mailer';
import { lagosDay, REQUIREMENT_KINDS } from './document-rules';
import { DocumentsConfigService } from './documents-config';

type Letters = Awaited<ReturnType<DocumentLettersService['lettersFor']>>;

/**
 * The couple's emails about their dashboard and letters. After a new
 * application, each partner gets one email: how to sign in to their own
 * dashboard, with the two letters attached to the applicant's (and to the
 * partner's too when the pastors switch that on). If the letters cannot be
 * built, the emails still go with the sign-in details, and the dispatch log
 * shows the failure so the office can resend. Nothing here can undo an
 * application, and nothing here throws.
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
    private readonly config: DocumentsConfigService,
  ) {}

  /** Creates the checklist rows where missing, inside the caller's transaction. */
  async prepare(tx: Prisma.TransactionClient, app: Pick<CounsellingApplication, 'id'>): Promise<void> {
    const tenantId = this.access.tenantId;
    await tx.counsellingDocumentRequirement.createMany({
      data: REQUIREMENT_KINDS.map((kind) => ({ id: randomUUID(), tenantId, applicationId: app.id, kind })),
      skipDuplicates: true,
    });
  }

  /** Right after an application: each partner's welcome email. Records the letters' outcome. */
  async welcome(app: CounsellingApplication, plans: SignInPlan[]): Promise<CounsellingDispatchStatus> {
    const issueDay = lagosDay(new Date());
    const built = await this.build(app, issueDay);
    const { sendDocumentsToPartner } = await this.config.values();
    const pdfs = built ? { consentPdf: built.consent, medicalPdf: built.medical } : null;

    const sent: CounsellingParticipantSide[] = [];
    let applicantOutcome: MailOutcome = { status: 'FAILED', messageId: null };
    for (const plan of plans) {
      if (plan.side === 'PARTNER' && plan.mode === 'FAILED') continue; // the office sends theirs once the account exists
      const signIn = { mode: plan.mode, phoneEnding: plan.phoneEnding };
      const base = { firstName: plan.firstName, email: plan.email, appUrl: this.mailer.appUrl };
      const out = await this.mailer.send(
        app,
        plan.side === 'APPLICANT' ? (pdfs ? 'DOCUMENTS' : 'RECEIVED') : 'PARTNER_WELCOME',
        plan.side === 'APPLICANT'
          ? buildApplicantWelcomeEmail({ ...base, signIn, letters: pdfs })
          : buildPartnerWelcomeEmail({ ...base, signIn, applicantFirstName: app.applicantFirstName, letters: sendDocumentsToPartner ? pdfs : null }),
      );
      if (plan.side === 'APPLICANT') applicantOutcome = out;
      if (out.status === 'SENT' && plan.mode !== 'FAILED') sent.push(plan.side);
    }
    await this.accounts.markSent(app, sent).catch(() => undefined);

    const status: CounsellingDispatchStatus = !built ? 'FAILED' : applicantOutcome.status;
    await this.record(app, built, issueDay, status, null, applicantOutcome.messageId);
    return status;
  }

  /** The office resends the letters (to the applicant, and the partner when switched on), with how to sign in. */
  async send(app: CounsellingApplication, plans: SignInPlan[], requestedById: string | null): Promise<CounsellingDispatchStatus> {
    const issueDay = lagosDay(new Date());
    const built = await this.build(app, issueDay);
    let status: CounsellingDispatchStatus = 'FAILED';
    let messageId: string | null = null;
    if (built) {
      const { sendDocumentsToPartner } = await this.config.values();
      const outcomes: MailOutcome[] = [];
      for (const plan of plans) {
        if (plan.side === 'PARTNER' && !sendDocumentsToPartner) continue;
        const out = await this.mailer.send(
          app,
          'DOCUMENTS',
          buildDocumentsEmail({
            firstName: plan.firstName,
            email: plan.email,
            appUrl: this.mailer.appUrl,
            signIn: { mode: plan.mode, phoneEnding: plan.phoneEnding },
            consentPdf: built.consent,
            medicalPdf: built.medical,
          }),
        );
        outcomes.push(out);
      }
      status = outcomes.every((x) => x.status === 'SENT') ? 'SENT' : outcomes.some((x) => x.status === 'FAILED') ? 'FAILED' : 'SKIPPED';
      messageId = outcomes[0]?.messageId ?? null;
    }
    await this.record(app, built, issueDay, status, requestedById, messageId);
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
        buildSignInEmail({ firstName: plan.firstName, email: plan.email, appUrl: this.mailer.appUrl, signIn: { mode: plan.mode, phoneEnding: plan.phoneEnding } }),
      );
      if (out.status === 'SENT') sent.push(plan.side);
      else worst = out.status === 'FAILED' || worst === 'FAILED' ? 'FAILED' : 'SKIPPED';
    }
    await this.accounts.markSent(app, sent).catch(() => undefined);
    return worst;
  }

  private async build(app: CounsellingApplication, issueDay: string): Promise<Letters | null> {
    try {
      return await this.letters.lettersFor(app, { issueDay });
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
