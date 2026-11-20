import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { z } from 'zod';
import type { AuthUser } from '../../auth/types/auth-user';
import { parseSchema } from '../../common/zod-parse.util';
import { PrismaService } from '../../prisma/prisma.service';
import { CaseAccess } from '../case-access';
import { counsellingAudit } from '../counselling-audit';
import { PENDING } from '../policy';

/**
 * The documents settings (letters, dashboard uploads, gate). Every value starts as
 * PENDING_PASTORAL_APPROVAL with the defaults the pastors were given, and the
 * system runs on whatever is saved, approved or not, until a Pastor changes it.
 * Stored under `documents` in CounsellingSettings.content, next to the policy.
 *
 * Who may open medical certificates is not a setting: it is the Pastor role
 * only (2026-11-20 decision), fixed in DocumentRules.
 *
 * Nothing here deletes documents. Files are kept; the retention policy value is
 * informational until the pastors decide one.
 */
const state = z.enum([PENDING, 'APPROVED']);
const entry = <T extends z.ZodType>(value: T) => z.object({ value, state });

const lab = z.object({
  name: z.string().trim().min(1, 'Give the laboratory a name').max(120),
  address: z.string().trim().max(240).default(''),
  phone: z.string().trim().max(40).default(''),
});
const reason = z.object({
  code: z
    .string()
    .trim()
    .regex(/^[A-Z][A-Z0-9_]{2,59}$/, 'Codes use capital letters, digits and underscores'),
  label: z.string().trim().min(1).max(120),
});
export const GATE_STATUSES = [
  'ACCEPTED_FOR_COUNSELLING',
  'IN_COUNSELLING',
  'FINAL_REVIEW',
  'COMPLETED',
] as const;

export const documentsConfigSchema = z.object({
  screeningTests: entry(z.array(z.string().trim().min(1).max(120)).min(1).max(20)),
  screeningValidityDays: entry(z.number().int().min(1).max(365)),
  recommendedLabs: entry(z.array(lab).max(10)),
  certReturnInstructions: entry(z.string().trim().min(1).max(1000)),
  consentReturnInstructions: entry(z.string().trim().min(1).max(1000)),
  maxUploadMb: entry(z.number().int().min(1).max(20)),
  /** Also attach the two letters to the partner's welcome email (they are on both dashboards either way). */
  sendDocumentsToPartner: entry(z.boolean()),
  documentsRequiredBefore: entry(z.enum(GATE_STATUSES)),
  overrideReasons: entry(z.array(reason).min(1).max(10)),
  medicalConsentWording: entry(z.string().trim().min(1).max(1000)),
  documentRetentionPolicy: entry(z.string().trim().max(2000)),
});
export type DocumentsConfig = z.infer<typeof documentsConfigSchema>;
export type DocumentsConfigKey = keyof DocumentsConfig;
/** Just the values, for the code that uses them. */
export type DocumentsSettings = { [K in DocumentsConfigKey]: DocumentsConfig[K]['value'] };

const pending = <T>(value: T) => ({ value, state: PENDING as typeof PENDING });

export const DEFAULT_DOCUMENTS_CONFIG: DocumentsConfig = {
  screeningTests: pending([
    'Genotype screening',
    'HIV 1 & 2 screening',
    'Hepatitis B screening',
    'Hepatitis C screening',
    'Blood group and Rhesus factor',
    'Syphilis screening',
  ]),
  screeningValidityDays: pending(30),
  recommendedLabs: pending([
    { name: 'Belrald Diagnostics', address: '', phone: '' },
    { name: 'Total Care Medical Diagnostics', address: '', phone: '' },
  ]),
  certReturnInstructions: pending(
    'Each of you should upload your own medical certificate on your counselling dashboard, or bring the original to the church office. Please do not send medical results by email or WhatsApp.',
  ),
  consentReturnInstructions: pending(
    'Once signed, upload a clear photo or scan of the consent letter on your counselling dashboard, or bring it to the church office.',
  ),
  maxUploadMb: pending(10),
  sendDocumentsToPartner: pending(false),
  documentsRequiredBefore: pending('FINAL_REVIEW' as const),
  overrideReasons: pending([
    { code: 'DOCUMENTS_SEEN_OUTSIDE_SYSTEM', label: 'Documents seen outside the system' },
    { code: 'PASTORAL_DISCRETION', label: 'Pastoral discretion' },
  ]),
  medicalConsentWording: pending(
    'I consent to Everlasting Hills Church securely storing this medical certificate for counselling purposes. It will be kept securely and seen only by the pastorate of Everlasting Hills Church.',
  ),
  documentRetentionPolicy: pending(''),
};

/** Saved values, key by key: a key that is missing or no longer valid falls back to its default. */
export function readDocumentsConfig(content: unknown): DocumentsConfig {
  const stored =
    content && typeof content === 'object' && 'documents' in content
      ? ((content as { documents?: unknown }).documents as Record<string, unknown> | undefined)
      : undefined;
  const out = { ...DEFAULT_DOCUMENTS_CONFIG } as Record<string, unknown>;
  const shape = documentsConfigSchema.shape as Record<string, z.ZodType>;
  for (const key of Object.keys(shape)) {
    const parsed = shape[key].safeParse(stored?.[key]);
    if (parsed.success) out[key] = parsed.data;
  }
  return out as DocumentsConfig;
}

export const valuesOf = (c: DocumentsConfig): DocumentsSettings =>
  Object.fromEntries(Object.entries(c).map(([k, v]) => [k, v.value])) as DocumentsSettings;

@Injectable()
export class DocumentsConfigService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: CaseAccess,
  ) {}

  async get(): Promise<DocumentsConfig> {
    const row = await this.prisma.counsellingSettings.findUnique({
      where: { tenantId: this.access.tenantId },
      select: { content: true },
    });
    return readDocumentsConfig(row?.content);
  }

  async values(): Promise<DocumentsSettings> {
    return valuesOf(await this.get());
  }

  /** For the Policy page: everyone on the marriage team may read, only a Pastor may change. */
  async forStaff(actor: AuthUser) {
    const tier = this.access.requireStaff(actor, 'curriculum');
    return { config: await this.get(), canEdit: tier === 'PASTOR' };
  }

  async save(actor: AuthUser, raw: unknown): Promise<DocumentsConfig> {
    this.access.requireStaff(actor, 'settings');
    const config = parseSchema(documentsConfigSchema, raw);
    const tenantId = this.access.tenantId;
    await this.prisma.$transaction(async (tx) => {
      const row = await tx.counsellingSettings.findUnique({ where: { tenantId }, select: { content: true } });
      const content = {
        ...(row?.content && typeof row.content === 'object' ? (row.content as object) : {}),
        documents: config,
      } as Prisma.InputJsonValue;
      await tx.counsellingSettings.upsert({
        where: { tenantId },
        create: { id: randomUUID(), tenantId, content, updatedBy: actor.profileId ?? null },
        update: { content, updatedBy: actor.profileId ?? null },
      });
      await counsellingAudit(tx, {
        tenantId,
        actor,
        action: 'COUNSELLING_DOCUMENT_SETTINGS_UPDATED',
        entity: 'CounsellingSettings',
        entityId: tenantId,
      });
    });
    return config;
  }
}
