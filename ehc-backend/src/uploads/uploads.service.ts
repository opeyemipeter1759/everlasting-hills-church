import {
  Injectable,
  InternalServerErrorException,
  ServiceUnavailableException,
} from '@nestjs/common';

export interface UploadResult {
  url: string;
  key: string;
}

/**
 * Thin wrapper around Cloudflare R2 (S3-compatible) object storage.
 *
 * Centralizes the R2 client setup so callers (image uploads today, more later)
 * don't each re-derive the endpoint/bucket/credentials. The AWS SDK is required
 * lazily so a missing dependency surfaces as a clean 500 rather than a boot-time
 * crash.
 */
@Injectable()
export class UploadsService {
  /**
   * PUT a file buffer into R2 under `<prefix>/<timestamp>-<rand>.<ext>` and return
   * its public URL + key. Throws ServiceUnavailableException if R2 isn't configured.
   */
  async uploadObject(
    file: { buffer: Buffer; mimetype: string; originalname: string },
    prefix: string,
  ): Promise<UploadResult> {
    if (
      !process.env.R2_ACCOUNT_ID ||
      !process.env.R2_ACCESS_KEY_ID ||
      !process.env.R2_SECRET_ACCESS_KEY
    ) {
      throw new ServiceUnavailableException(
        'R2 storage is not configured. Add R2_* env vars.',
      );
    }

    const ext = (file.originalname || '').split('.').pop() ?? 'bin';
    const key = `${prefix}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    try {
      // Lazily require the AWS SDK v3 to avoid a hard compile-time dependency.
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
      throw new InternalServerErrorException(`Upload to R2 failed: ${msg}`);
    }

    const publicUrl = (process.env.R2_PUBLIC_URL ?? '').replace(/\/$/, '');
    const url = publicUrl ? `${publicUrl}/${key}` : key;
    return { url, key };
  }
}
