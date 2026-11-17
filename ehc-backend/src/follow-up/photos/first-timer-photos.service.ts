import { randomUUID } from 'node:crypto';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../../config/env.validation';
import type { AuthUser } from '../../auth/types/auth-user';
import { PipelineRepository } from '../../pipeline/pipeline.repository';
import { PrismaService } from '../../prisma/prisma.service';
import { FollowUpAuthService } from '../services/follow-up-auth.service';
import { isPhotoKeyOf, isTenantPhotoKey, photoKeyFor, type PhotoUploadRequest } from './first-timer-photo.schema';
import { FirstTimerPhotoStorage, type SignedUpload } from './first-timer-photo-storage.service';
import { PhotoUrlService } from './photo-url.service';

/**
 * Attaching, replacing and removing a first-timer's photo.
 *
 * The browser asks for a one-time upload link, sends the resized photo
 * straight to the private bucket, then confirms the key here. Only then is
 * the photo, and the consent that came with it, put on their record.
 */
@Injectable()
export class FirstTimerPhotosService {
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly pipeline: PipelineRepository,
    private readonly auth: FollowUpAuthService,
    private readonly storage: FirstTimerPhotoStorage,
    private readonly urls: PhotoUrlService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  /** A one-time upload link for a new photo of this person. Type, size and consent are checked by the schema first. */
  async uploadUrl(actor: AuthUser, visitorId: string, req: PhotoUploadRequest): Promise<SignedUpload & { key: string }> {
    await this.requirePerson(actor, visitorId);
    const key = photoKeyFor(this.tenantId, visitorId, randomUUID(), req.contentType);
    const signed = await this.storage.signUpload(key, req.contentType);
    return { ...signed, key };
  }

  /** Puts an uploaded photo on their record, and deletes the photo it replaces. */
  async confirm(actor: AuthUser, visitorId: string, key: string): Promise<{ photoUrl: string | null }> {
    await this.requirePerson(actor, visitorId);
    if (!isPhotoKeyOf(key, this.tenantId, visitorId)) {
      throw new BadRequestException('That photo does not belong to this person');
    }
    if (!(await this.storage.exists(key))) {
      throw new BadRequestException('That photo has not finished uploading. Try attaching it again.');
    }

    const previous = await this.currentKey(visitorId);
    await this.prisma.visitor.updateMany({
      where: { id: visitorId, tenantId: this.tenantId },
      data: { photoKey: key, photoConsent: true, photoConsentAt: new Date() },
    });
    if (previous && previous !== key) await this.removeObject(previous);

    const signed = await this.urls.signMany([key]);
    return { photoUrl: signed.get(key) ?? null };
  }

  /** Takes the photo off their record and out of storage. Consent goes with it. */
  async remove(actor: AuthUser, visitorId: string): Promise<{ removed: boolean }> {
    await this.requirePerson(actor, visitorId);
    const previous = await this.currentKey(visitorId);
    if (!previous) return { removed: false };

    await this.prisma.visitor.updateMany({
      where: { id: visitorId, tenantId: this.tenantId },
      data: { photoKey: null, photoConsent: false, photoConsentAt: null },
    });
    await this.removeObject(previous);
    return { removed: true };
  }

  /** The follow-up team, and a person this church still has on record (not archived, not another tenant's). */
  private async requirePerson(actor: AuthUser, visitorId: string): Promise<void> {
    await this.auth.requireAccess(actor);
    if (!(await this.pipeline.one(visitorId))) throw new NotFoundException('First-timer not found');
  }

  /** Only ever deletes inside this tenant's photo folder, whatever the column holds. */
  private async removeObject(key: string): Promise<void> {
    if (isTenantPhotoKey(key, this.tenantId)) await this.storage.remove([key]);
  }

  private async currentKey(visitorId: string): Promise<string | null> {
    const visitor = await this.prisma.visitor.findFirst({
      where: { id: visitorId, tenantId: this.tenantId },
      select: { photoKey: true },
    });
    return visitor?.photoKey ?? null;
  }
}
