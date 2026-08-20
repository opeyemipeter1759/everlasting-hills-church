import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'crypto';
import type { Env } from '../../config/env.validation';
import { pageDef } from '../page-registry';
import { CmsPageCoreService } from './cms-page-core.service';

/** Signed, 1-hour-TTL preview links for draft content. */
@Injectable()
export class CmsPreviewService {
  private readonly previewSecret: string;

  constructor(
    private readonly pageCore: CmsPageCoreService,
    config: ConfigService<Env, true>,
  ) {
    this.previewSecret = config.get('CMS_PREVIEW_SECRET', { infer: true });
  }

  createPreviewToken(key: string) {
    this.pageCore.assertKnownKey(key);
    const exp = Date.now() + 60 * 60 * 1000;
    const payload = `${key}.${exp}`;
    const sig = createHmac('sha256', this.previewSecret).update(payload).digest('base64url');
    const token = Buffer.from(`${payload}.${sig}`).toString('base64url');
    return { token, expiresAt: new Date(exp).toISOString() };
  }

  async resolvePreview(token: string) {
    let key: string;
    let exp: number;
    let sig: string;
    try {
      const decoded = Buffer.from(token, 'base64url').toString('utf8');
      const parts = decoded.split('.');
      sig = parts.pop() as string;
      exp = Number(parts.pop());
      key = parts.join('.');
    } catch {
      throw new BadRequestException('Invalid preview token');
    }
    const expected = createHmac('sha256', this.previewSecret).update(`${key}.${exp}`).digest('base64url');
    const a = Buffer.from(sig ?? '');
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      throw new BadRequestException('Invalid preview token');
    }
    if (!Number.isFinite(exp) || Date.now() > exp) {
      throw new BadRequestException('Preview link expired');
    }
    const editor = await this.pageCore.getEditorPage(key);
    const def = pageDef(key)!;
    return { key, route: def.route, title: editor.page.title, preview: true, content: editor.working.content };
  }
}
