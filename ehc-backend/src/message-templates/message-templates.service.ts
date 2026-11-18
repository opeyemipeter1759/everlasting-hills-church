import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import type { MessageTemplate } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { Env } from '../config/env.validation';
import type { AuthUser } from '../auth/types/auth-user';
import { parseSchema } from '../common/zod-parse.util';
import { requireOpeningSender } from './opening-access';
import { churchValues } from './opening-message.render';
import { saveTemplateSchema, type SaveTemplateInput } from './message-template.schema';
import { OPENING_TEMPLATE_V1 } from './opening-template.seed';
import {
  EMAIL_BODY_MAX,
  EMAIL_SUBJECT_MAX,
  TEMPLATE_KEYS,
  TEMPLATE_VARIABLES,
  WHATSAPP_MAX,
  longestRenderedLength,
  unknownPlaceholderMessage,
  unknownPlaceholders,
  type TemplateKey,
} from './template-variables';

/** How many past versions the editor lists. */
const HISTORY_LIMIT = 50;

export interface TemplateVersionView {
  version: number;
  whatsappBody: string;
  emailSubject: string;
  emailBody: string;
  editedById: string | null;
  editedByName: string | null;
  createdAt: string;
  active: boolean;
}

/**
 * Message templates, one church at a time. Nothing is ever edited in place:
 * every save is a new version with its editor and time, the newest is the one
 * in use, and reverting saves an old version's words as a new version.
 */
@Injectable()
export class MessageTemplatesService {
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  assertKey(key: string): TemplateKey {
    if (!(TEMPLATE_KEYS as readonly string[]).includes(key)) throw new NotFoundException('There is no template with that name');
    return key as TemplateKey;
  }

  /** The version in use: the newest. Null until the first save. */
  async active(key: TemplateKey, tenantId = this.tenantId): Promise<MessageTemplate | null> {
    return this.prisma.messageTemplate.findFirst({ where: { tenantId, key }, orderBy: { version: 'desc' } });
  }

  async version(key: TemplateKey, version: number): Promise<MessageTemplate | null> {
    return this.prisma.messageTemplate.findUnique({ where: { tenantId_key_version: { tenantId: this.tenantId, key, version } } });
  }

  /** The editor's view: the newest versions, who saved each, and the rules a save must meet. */
  async history(actor: AuthUser, key: string) {
    requireOpeningSender(actor);
    const k = this.assertKey(key);
    const rows = await this.prisma.messageTemplate.findMany({
      where: { tenantId: this.tenantId, key: k },
      orderBy: { version: 'desc' },
      take: HISTORY_LIMIT,
    });
    const names = await this.editorNames(rows.map((r) => r.editedById));
    const versions: TemplateVersionView[] = rows.map((r, i) => ({
      version: r.version,
      whatsappBody: r.whatsappBody,
      emailSubject: r.emailSubject,
      emailBody: r.emailBody,
      editedById: r.editedById,
      editedByName: r.editedById ? (names.get(r.editedById) ?? null) : null,
      createdAt: r.createdAt.toISOString(),
      active: i === 0,
    }));
    return {
      key: k,
      active: versions[0] ?? null,
      versions,
      variables: TEMPLATE_VARIABLES,
      limits: { whatsappMax: WHATSAPP_MAX, emailSubjectMax: EMAIL_SUBJECT_MAX, emailBodyMax: EMAIL_BODY_MAX },
      /** The church's fixed values, so the editor can count the longest WhatsApp message exactly as a save will. */
      church: churchValues(),
    };
  }

  /** Saves a new version, which is in use straight away. Unknown placeholders and an over-long WhatsApp message are refused. */
  async save(actor: AuthUser, key: string, raw: unknown) {
    requireOpeningSender(actor);
    const k = this.assertKey(key);
    const input = parseSchema(saveTemplateSchema, raw);
    this.check(input);
    return this.prisma.$transaction(async (tx) => {
      // Two saves at once must not both take the same version number.
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`template:${this.tenantId}:${k}`}))`;
      const latest = await tx.messageTemplate.findFirst({
        where: { tenantId: this.tenantId, key: k },
        orderBy: { version: 'desc' },
        select: { version: true, emailSubject: true, emailBody: true },
      });
      return tx.messageTemplate.create({
        data: {
          id: randomUUID(),
          tenantId: this.tenantId,
          key: k,
          version: (latest?.version ?? 0) + 1,
          whatsappBody: input.whatsappBody,
          emailSubject: input.emailSubject || latest?.emailSubject || OPENING_TEMPLATE_V1.emailSubject,
          emailBody: input.emailBody || latest?.emailBody || OPENING_TEMPLATE_V1.emailBody,
          editedById: actor.profileId ?? null,
        },
      });
    });
  }

  /** One-click revert: the old version's words, saved as the newest version. */
  async revert(actor: AuthUser, key: string, version: number) {
    requireOpeningSender(actor);
    const k = this.assertKey(key);
    const old = await this.version(k, version);
    if (!old) throw new NotFoundException('That version does not exist');
    const current = await this.active(k);
    if (current && current.version === old.version) return current;
    return this.save(actor, k, { whatsappBody: old.whatsappBody, emailSubject: old.emailSubject, emailBody: old.emailBody });
  }

  /** The two rules beyond field lengths: only known placeholders, and a WhatsApp message within the cap once filled in. */
  check(input: SaveTemplateInput): void {
    const unknown = unknownPlaceholders(input.whatsappBody, input.emailSubject ?? '', input.emailBody ?? '');
    if (unknown.length) {
      throw new BadRequestException({ message: unknownPlaceholderMessage(unknown), error: 'Unknown placeholder', unknown });
    }
    const longest = longestRenderedLength(input.whatsappBody, churchValues());
    if (longest > WHATSAPP_MAX) {
      throw new BadRequestException({
        message: `The WhatsApp message can be up to ${WHATSAPP_MAX.toLocaleString('en-GB')} characters once names are filled in. This one can reach ${longest.toLocaleString('en-GB')}, so shorten it a little.`,
        error: 'WhatsApp message too long',
      });
    }
  }

  private async editorNames(ids: (string | null)[]): Promise<Map<string, string>> {
    const unique = [...new Set(ids.filter((id): id is string => !!id))];
    if (!unique.length) return new Map();
    const profiles = await this.prisma.profile.findMany({
      where: { id: { in: unique } },
      select: { id: true, Member: { select: { firstName: true, lastName: true } } },
    });
    return new Map(profiles.filter((p) => p.Member).map((p) => [p.id, `${p.Member!.firstName} ${p.Member!.lastName}`]));
  }
}
