import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { UploadsService } from '../../uploads/uploads.service';
import type { Env } from '../../config/env.validation';
import { CmsAuditService } from './cms-audit.service';

@Injectable()
export class CmsMediaService {
  private readonly tenantId: string;
  private readonly r2PublicUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly uploads: UploadsService,
    private readonly audit: CmsAuditService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
    this.r2PublicUrl = (process.env.R2_PUBLIC_URL ?? '').replace(/\/$/, '');
  }

  private mediaUrl(r2Key: string) {
    return this.r2PublicUrl ? `${this.r2PublicUrl}/${r2Key}` : r2Key;
  }

  async listMedia() {
    const rows = await this.prisma.mediaAsset.findMany({
      where: { tenantId: this.tenantId },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    return rows.map((m) => ({
      id: m.id,
      url: this.mediaUrl(m.r2Key),
      alt: m.alt,
      mimeType: m.mimeType,
      sizeBytes: m.sizeBytes,
      width: m.width,
      height: m.height,
      createdAt: m.createdAt,
    }));
  }

  async uploadMedia(
    file: { buffer: Buffer; mimetype: string; originalname: string; size: number },
    meta: { alt: string; width?: number; height?: number },
    actorId?: string | null,
  ) {
    if (!meta.alt?.trim()) throw new BadRequestException('Alt text is required');
    const { key } = await this.uploads.uploadObject(file, `cms/${this.tenantId}`);
    const asset = await this.prisma.mediaAsset.create({
      data: {
        id: randomUUID(),
        tenantId: this.tenantId,
        r2Key: key,
        alt: meta.alt.trim(),
        mimeType: file.mimetype,
        sizeBytes: file.size,
        width: meta.width ?? null,
        height: meta.height ?? null,
        uploadedBy: actorId ?? null,
      },
    });
    await this.audit.write({ action: 'CREATE', entity: 'MediaAsset', entityId: asset.id, actorId, after: { r2Key: key, alt: asset.alt } });
    return { id: asset.id, url: this.mediaUrl(asset.r2Key), alt: asset.alt, mimeType: asset.mimeType, sizeBytes: asset.sizeBytes, width: asset.width, height: asset.height, createdAt: asset.createdAt };
  }

  async deleteMedia(id: string, actorId?: string | null) {
    const asset = await this.prisma.mediaAsset.findFirst({ where: { id, tenantId: this.tenantId } });
    if (!asset) throw new NotFoundException('Media not found');
    await this.prisma.mediaAsset.delete({ where: { id } });
    await this.audit.write({ action: 'DELETE', entity: 'MediaAsset', entityId: id, actorId, before: { r2Key: asset.r2Key } });
    return { success: true, id };
  }
}
