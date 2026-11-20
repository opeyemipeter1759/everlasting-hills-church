import { ConflictException, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import type { CounsellingDocumentTemplate, CounsellingLetterKind, Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { z } from 'zod';
import type { AuthUser } from '../../auth/types/auth-user';
import { parseSchema } from '../../common/zod-parse.util';
import { PrismaService } from '../../prisma/prisma.service';
import { CaseAccess, notFound } from '../case-access';
import { counsellingAudit } from '../counselling-audit';
import { DocumentsConfigService, type DocumentsSettings } from './documents-config';
import { letterVars } from './document-rules';
import { blocksSchema, SEED_BODIES, type Block, type LetterVars } from './letter-blocks';
import { LetterRenderer } from './letter-renderer';

export const LETTER_KINDS: readonly CounsellingLetterKind[] = ['PARENTAL_CONSENT', 'MEDICAL_SCREENING'];
const TITLES: Record<CounsellingLetterKind, string> = {
  PARENTAL_CONSENT: 'Parental consent and blessing',
  MEDICAL_SCREENING: 'Pre-marital medical screening requirement',
};

/** Made-up details for previews and samples. */
export const SAMPLE_VARS: LetterVars = {
  applicationRef: '7K4QH2',
  issueDate: '20 November 2026',
  groomName: 'Tunde Adeyemi',
  brideName: 'Ada Eze',
  applicationDate: '20 November 2026',
  validFromDate: '21 October 2026',
  returnInstructions: '',
};

type LetterApp = Parameters<typeof letterVars>[0];

/**
 * The two letters: their versioned wording, and turning an application into
 * the two PDFs. Version 1 of each is seeded (DRAFT) when a church has none.
 * Sending uses the active version: the newest approved one, or v1 until any
 * version is approved. Letters are never stored; they are rebuilt from the
 * versions a dispatch recorded.
 */
@Injectable()
export class DocumentLettersService implements OnModuleInit {
  private readonly logger = new Logger(DocumentLettersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly access: CaseAccess,
    private readonly config: DocumentsConfigService,
    private readonly renderer: LetterRenderer,
  ) {}

  async onModuleInit() {
    try {
      await this.seed();
    } catch (err) {
      this.logger.warn(`Could not seed the counselling letter templates: ${(err as Error).message}`);
    }
  }

  async seed(tenantId = this.access.tenantId) {
    for (const kind of LETTER_KINDS) {
      const any = await this.prisma.counsellingDocumentTemplate.findFirst({ where: { tenantId, kind }, select: { id: true } });
      if (any) continue;
      await this.prisma.counsellingDocumentTemplate
        .create({
          data: {
            id: randomUUID(),
            tenantId,
            kind,
            version: 1,
            body: SEED_BODIES[kind] as unknown as Prisma.InputJsonValue,
            active: true,
          },
        })
        .catch(() => undefined); // another instance seeded it first
    }
  }

  async active(kind: CounsellingLetterKind): Promise<CounsellingDocumentTemplate> {
    const tenantId = this.access.tenantId;
    let row = await this.prisma.counsellingDocumentTemplate.findFirst({ where: { tenantId, kind, active: true } });
    if (!row) {
      await this.seed(tenantId);
      row = await this.prisma.counsellingDocumentTemplate.findFirst({ where: { tenantId, kind, active: true } });
    }
    if (!row) throw new Error(`No active ${kind} letter template`);
    return row;
  }

  /** Both letters for one application, from the given template versions (default: the active ones). */
  async lettersFor(
    app: LetterApp,
    o: { issueDay: string; consentTemplateId?: string | null; medicalTemplateId?: string | null },
  ) {
    const settings = await this.config.values();
    const [consentT, medicalT] = await Promise.all([
      this.templateOrActive('PARENTAL_CONSENT', o.consentTemplateId),
      this.templateOrActive('MEDICAL_SCREENING', o.medicalTemplateId),
    ]);
    const [consent, medical] = await Promise.all([
      this.renderer.render(this.input('PARENTAL_CONSENT', consentT.body, letterVars(app, { issueDay: o.issueDay, validityDays: settings.screeningValidityDays, returnInstructions: settings.consentReturnInstructions }), settings)),
      this.renderer.render(this.input('MEDICAL_SCREENING', medicalT.body, letterVars(app, { issueDay: o.issueDay, validityDays: settings.screeningValidityDays, returnInstructions: settings.certReturnInstructions }), settings)),
    ]);
    return {
      consent: Buffer.from(consent.bytes),
      medical: Buffer.from(medical.bytes),
      consentTemplateId: consentT.id,
      medicalTemplateId: medicalT.id,
    };
  }

  private async templateOrActive(kind: CounsellingLetterKind, id?: string | null) {
    if (id) {
      const row = await this.prisma.counsellingDocumentTemplate.findFirst({ where: { id, tenantId: this.access.tenantId, kind } });
      if (row) return row;
    }
    return this.active(kind);
  }

  private input(kind: CounsellingLetterKind, body: unknown, vars: LetterVars, s: DocumentsSettings) {
    return { title: TITLES[kind], blocks: blocksSchema.parse(body), vars, tests: s.screeningTests, labs: s.recommendedLabs };
  }

  // ---- The Letters tab on Marriage > Policy ----

  async list(actor: AuthUser) {
    const tier = this.access.requireStaff(actor, 'curriculum');
    const rows = await this.prisma.counsellingDocumentTemplate.findMany({
      where: { tenantId: this.access.tenantId },
      orderBy: [{ kind: 'asc' }, { version: 'desc' }],
    });
    return {
      canEdit: true,
      canApprove: tier === 'PASTOR',
      templates: rows.map((r) => ({
        id: r.id,
        kind: r.kind,
        version: r.version,
        approvalState: r.approvalState,
        active: r.active,
        createdAt: r.createdAt,
        approvedAt: r.approvedAt,
        body: r.body as unknown as Block[],
      })),
    };
  }

  /** Saves new wording as the next version (a draft; sending is unchanged until a Pastor approves it). */
  async saveVersion(actor: AuthUser, kind: CounsellingLetterKind, raw: unknown) {
    this.access.requireStaff(actor, 'curriculum');
    const { blocks } = parseSchema(z.object({ blocks: blocksSchema }), raw);
    const tenantId = this.access.tenantId;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        return await this.prisma.$transaction(async (tx) => {
          const last = await tx.counsellingDocumentTemplate.findFirst({ where: { tenantId, kind }, orderBy: { version: 'desc' }, select: { version: true } });
          const row = await tx.counsellingDocumentTemplate.create({
            data: {
              id: randomUUID(),
              tenantId,
              kind,
              version: (last?.version ?? 0) + 1,
              body: blocks as unknown as Prisma.InputJsonValue,
              createdById: actor.profileId ?? null,
            },
          });
          await counsellingAudit(tx, { tenantId, actor, action: 'COUNSELLING_LETTER_VERSION_SAVED', entity: 'CounsellingDocumentTemplate', entityId: row.id });
          return { id: row.id, version: row.version };
        });
      } catch (err) {
        if ((err as { code?: string }).code !== 'P2002') throw err;
      }
    }
    throw new ConflictException('Someone else saved a version just now. Reload and try again.');
  }

  /** Pastor only. The approved version becomes the one that is sent. */
  async approve(actor: AuthUser, id: string) {
    this.access.requireStaff(actor, 'settings');
    const tenantId = this.access.tenantId;
    const row = await this.prisma.counsellingDocumentTemplate.findFirst({ where: { id, tenantId } });
    if (!row) throw notFound();
    await this.prisma.$transaction(async (tx) => {
      await tx.counsellingDocumentTemplate.updateMany({ where: { tenantId, kind: row.kind, active: true }, data: { active: false } });
      await tx.counsellingDocumentTemplate.update({
        where: { id },
        data: { approvalState: 'APPROVED', approvedAt: row.approvedAt ?? new Date(), approvedById: row.approvedById ?? actor.profileId ?? null, active: true },
      });
      await counsellingAudit(tx, { tenantId, actor, action: 'COUNSELLING_LETTER_APPROVED', entity: 'CounsellingDocumentTemplate', entityId: id });
    });
    return { id, active: true };
  }

  /** The wording on the letterhead with made-up names, for checking before saving. */
  async preview(actor: AuthUser, kind: CounsellingLetterKind, raw: unknown): Promise<Buffer> {
    this.access.requireStaff(actor, 'curriculum');
    const { blocks } = parseSchema(z.object({ blocks: blocksSchema }), raw);
    const s = await this.config.values();
    const vars = { ...SAMPLE_VARS, returnInstructions: kind === 'PARENTAL_CONSENT' ? s.consentReturnInstructions : s.certReturnInstructions };
    const out = await this.renderer.render({ title: TITLES[kind], blocks, vars, tests: s.screeningTests, labs: s.recommendedLabs });
    return Buffer.from(out.bytes);
  }
}
