import { Injectable, Logger } from '@nestjs/common';
import type { CounsellingApplication, CounsellingDispatchStatus, CounsellingTokenScope, Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { buildDocumentLinkEmail, buildDocumentsEmail } from '../../notifications/templates/counselling-documents.email';
import { PrismaService } from '../../prisma/prisma.service';
import { CaseAccess } from '../case-access';
import { CounsellingNotifier } from '../counselling-notifier';
import { CoupleAccessService } from './couple-access.service';
import { DocumentLettersService } from './document-letters.service';
import { DocumentMailer, type MailOutcome } from './document-mailer';
import { lagosDay, REQUIREMENT_KINDS, scopeFor } from './document-rules';
import { DocumentsConfigService, type DocumentsSettings } from './documents-config';

export type IssuedLink = { raw: string; scope: CounsellingTokenScope };

/**
 * Sends the letters and the secure link. After a new application this is the
 * one email the couple gets. If the letters cannot be built, a plain
 * acknowledgement goes instead and the dispatch log shows the failure, so the
 * office can resend. Nothing here can undo an application.
 */
@Injectable()
export class DocumentDispatchService {
  private readonly logger = new Logger(DocumentDispatchService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly access: CaseAccess,
    private readonly letters: DocumentLettersService,
    private readonly mailer: DocumentMailer,
    private readonly couple: CoupleAccessService,
    private readonly config: DocumentsConfigService,
    private readonly notifier: CounsellingNotifier,
  ) {}

  /** Creates the checklist rows (where missing) and new links, inside the caller's transaction. */
  async prepare(
    tx: Prisma.TransactionClient,
    app: Pick<CounsellingApplication, 'id' | 'applicantRole' | 'partnerEmail'>,
    settings: DocumentsSettings,
    createdById: string | null,
  ): Promise<IssuedLink[]> {
    const tenantId = this.access.tenantId;
    await tx.counsellingDocumentRequirement.createMany({
      data: REQUIREMENT_KINDS.map((kind) => ({ id: randomUUID(), tenantId, applicationId: app.id, kind })),
      skipDuplicates: true,
    });
    await tx.counsellingAccessToken.updateMany({
      where: { tenantId, applicationId: app.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    const scopes: CounsellingTokenScope[] =
      settings.sendDocumentsToPartner && app.partnerEmail && app.applicantRole
        ? [scopeFor(app.applicantRole, 'applicant'), scopeFor(app.applicantRole, 'partner')]
        : ['ALL'];
    const links: IssuedLink[] = [];
    for (const scope of scopes)
      links.push({
        scope,
        raw: await this.couple.createToken(tx, { applicationId: app.id, scope, validDays: settings.documentLinkValidDays, createdById }),
      });
    return links;
  }

  /** The letters and links by email. Records the outcome; never throws. */
  async send(
    app: CounsellingApplication,
    links: IssuedLink[],
    o: { requestedById: string | null; acknowledgeOnFailure: boolean },
  ): Promise<CounsellingDispatchStatus> {
    const issueDay = lagosDay(new Date());
    const settings = await this.config.values();
    let built: Awaited<ReturnType<DocumentLettersService['lettersFor']>> | null = null;
    try {
      if (!links.length) throw new Error('no link');
      built = await this.letters.lettersFor(app, { issueDay });
    } catch (err) {
      this.logger.warn(`Could not build the counselling letters for application ${app.id}: ${(err as Error).name}`);
    }

    let status: CounsellingDispatchStatus = 'FAILED';
    let messageId: string | null = null;
    if (built) {
      const outcomes: MailOutcome[] = [];
      for (const link of links) {
        const to = this.couple.recipient(app, link.scope);
        outcomes.push(
          await this.mailer.send(
            app,
            'DOCUMENTS',
            buildDocumentsEmail({
              firstName: to.firstName,
              email: to.email,
              contactUrl: this.mailer.contactUrl,
              link: this.mailer.linkFor(link.raw),
              validDays: settings.documentLinkValidDays,
              consentPdf: built.consent,
              medicalPdf: built.medical,
            }),
          ),
        );
      }
      status = outcomes.every((x) => x.status === 'SENT') ? 'SENT' : outcomes.some((x) => x.status === 'FAILED') ? 'FAILED' : 'SKIPPED';
      messageId = outcomes[0]?.messageId ?? null;
    }
    if (status === 'FAILED' && o.acknowledgeOnFailure) await this.notifier.send(app, 'RECEIVED');

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
          requestedById: o.requestedById,
        },
      })
      .catch((err: Error) => this.logger.warn(`Could not log a documents dispatch: ${err.name}`));
    return status;
  }

  /** Only a new link, by email (the office reissued it). */
  async sendLinks(app: CounsellingApplication, links: IssuedLink[]): Promise<MailOutcome['status']> {
    const settings = await this.config.values();
    let worst: MailOutcome['status'] = 'SENT';
    for (const link of links) {
      const to = this.couple.recipient(app, link.scope);
      const out = await this.mailer.send(
        app,
        'DOCUMENT_LINK',
        buildDocumentLinkEmail({
          firstName: to.firstName,
          email: to.email,
          contactUrl: this.mailer.contactUrl,
          link: this.mailer.linkFor(link.raw),
          validDays: settings.documentLinkValidDays,
        }),
      );
      if (out.status !== 'SENT') worst = out.status;
    }
    return worst;
  }
}
