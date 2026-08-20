import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MemberSelfLookupService } from './member-self-lookup.service';
import { hasValidFileSignature } from '../../uploads/file-signature.util';

/**
 * Upload a profile photo to Cloudflare R2 and stamp the public URL on the Member row.
 * Mirrors the sermon-audio upload pattern in sermons.controller.ts so we stay consistent
 * about how blob storage is wired (one place to swap providers later if needed).
 */
@Injectable()
export class MemberAvatarService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly selfLookup: MemberSelfLookupService,
  ) {}

  async setMyAvatar(
    userId: string,
    file: {
      buffer: Buffer;
      mimetype: string;
      originalname: string;
      size: number;
    },
    fallbackEmail?: string,
  ) {
    const { memberId } = await this.selfLookup.getMyMember(userId, fallbackEmail);

    const maxBytes = 1 * 1024 * 1024;
    if (file.size > maxBytes) {
      throw new BadRequestException('Photo must be under 1 MB');
    }
    const allowed = ['image/png', 'image/jpeg', 'image/jpg'];
    if (!allowed.includes(file.mimetype)) {
      throw new BadRequestException('Photo must be PNG, JPG, or JPEG');
    }
    if (!hasValidFileSignature(file)) {
      throw new BadRequestException('Photo content does not match its declared format');
    }

    if (
      !process.env.R2_ACCOUNT_ID ||
      !process.env.R2_ACCESS_KEY_ID ||
      !process.env.R2_SECRET_ACCESS_KEY
    ) {
      throw new InternalServerErrorException(
        'Photo storage is not configured on this server. Add R2_* env vars.',
      );
    }

    const ext = file.mimetype === 'image/png' ? 'png' : 'jpg';
    const key = `avatars/${memberId}-${Date.now()}.${ext.toLowerCase()}`;

    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
      const endpoint =
        process.env.R2_ENDPOINT ??
        `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
      const bucket =
        process.env.R2_BUCKET ??
        process.env.R2_BUCKET_NAME ??
        process.env.R2_ACCOUNT_ID;
      const client = new S3Client({
        endpoint,
        region: 'auto',
        credentials: {
          accessKeyId: process.env.R2_ACCESS_KEY_ID,
          secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
        },
      });
      await client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype,
        }),
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      throw new InternalServerErrorException(`Avatar upload failed: ${msg}`);
    }

    const publicBase = (process.env.R2_PUBLIC_URL ?? '').replace(/\/$/, '');
    const photoUrl = publicBase ? `${publicBase}/${key}` : key;

    await this.prisma.member.update({
      where: { id: memberId },
      data: { photoUrl },
    });
    return { photoUrl };
  }

  async clearMyAvatar(userId: string, fallbackEmail?: string) {
    const { memberId } = await this.selfLookup.getMyMember(userId, fallbackEmail);
    await this.prisma.member.update({
      where: { id: memberId },
      data: { photoUrl: null },
    });
    return { success: true };
  }
}
