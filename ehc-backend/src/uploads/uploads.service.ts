import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  ServiceUnavailableException,
} from '@nestjs/common';

export interface UploadResult {
  url: string;
  key: string;
}

type UploadFile = { buffer: Buffer; mimetype: string; originalname: string; size: number };

const SAFE_EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/avif': 'avif',
  'application/pdf': 'pdf',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
};

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
   * HEIC/HEIF (the default photo format on iPhone) decodes fine but no browser
   * renders it via `<img>`, so it's converted to JPEG here — the one format
   * conversion this endpoint does — rather than accepted and stored as-is.
   * `heic-convert` is pure JS (libheif via WASM), avoiding the native-binary
   * HEIC patent/licensing gap in most prebuilt `sharp` binaries.
   */
  async convertHeicToJpeg(file: UploadFile): Promise<UploadFile> {
    try {
      // Lazily required, same rationale as the AWS SDK below.
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const convert = require('heic-convert');
      const jpegBuffer: Buffer = await convert({ buffer: file.buffer, format: 'JPEG', quality: 0.9 });
      return {
        buffer: jpegBuffer,
        mimetype: 'image/jpeg',
        originalname: file.originalname.replace(/\.(heic|heif)$/i, '.jpg'),
        size: jpegBuffer.length,
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      throw new BadRequestException(`Couldn't convert this HEIC image: ${msg}`);
    }
  }

  /**
   * Upload a file buffer into Supabase Storage under `<prefix>/<timestamp>-<rand>.<ext>`
   * and return its public URL + key. Reuses the same project credentials as auth
   * (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY) rather than a separate R2 account —
   * this project never had Cloudflare R2 credentials configured, so this avoids
   * needing a second storage provider. Throws ServiceUnavailableException if
   * those credentials are missing.
   */
  async uploadObject(
    file: { buffer: Buffer; mimetype: string; originalname: string },
    prefix: string,
  ): Promise<UploadResult> {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new ServiceUnavailableException(
        'Storage is not configured. Add SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY env vars.',
      );
    }

    const ext = SAFE_EXTENSIONS[file.mimetype.toLowerCase()] ?? 'bin';
    const key = `${prefix}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const bucket = process.env.SUPABASE_STORAGE_BUCKET ?? 'ehc-uploads';

    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { createClient } = require('@supabase/supabase-js');
      const client = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

      const { error } = await client.storage.from(bucket).upload(key, file.buffer, {
        contentType: file.mimetype,
        cacheControl: '31536000',
        upsert: false,
      });
      if (error) throw new Error(error.message);

      const { data } = client.storage.from(bucket).getPublicUrl(key);
      return { url: data.publicUrl, key };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      throw new InternalServerErrorException(`Upload failed: ${msg}`);
    }
  }
}
