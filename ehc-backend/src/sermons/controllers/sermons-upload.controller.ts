import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  InternalServerErrorException,
  Post,
  ServiceUnavailableException,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsString, Max, Min } from 'class-validator';
import { Role } from '@prisma/client';
import type { S3Client } from '@aws-sdk/client-s3';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import type { AuthUser } from '../../auth/types/auth-user';
import { hasValidFileSignature } from '../../uploads/file-signature.util';
import { SermonsAuthService } from '../services/sermons-auth.service';

/**
 * Multipart uploads pass through the API, so they stay small: the hosting
 * platforms cap a request body well below this anyway. Anything bigger goes
 * straight to R2 through /sermons/audio-upload-url.
 */
const MAX_PROXIED_AUDIO_BYTES = 100 * 1024 * 1024;
/** Largest sermon recording the Audio Production team may upload directly to R2. */
export const MAX_DIRECT_AUDIO_BYTES = 1024 * 1024 * 1024;
/** How long an upload link can be started with. R2 checks it when the upload begins, not when it ends. */
const UPLOAD_URL_TTL_SECONDS = 60 * 60;

const AUDIO_MIME = ['audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/ogg', 'audio/aac'];
const AUDIO_EXT: Record<string, string> = {
  'audio/mpeg': 'mp3',
  'audio/mp4': 'm4a',
  'audio/wav': 'wav',
  'audio/ogg': 'ogg',
  'audio/aac': 'aac',
};
const CACHE_CONTROL = 'public, max-age=31536000, immutable';

class AudioUploadUrlDto {
  @IsString() @IsIn(AUDIO_MIME) contentType!: string;
  @Type(() => Number) @IsInt() @Min(1) @Max(MAX_DIRECT_AUDIO_BYTES) size!: number;
}

interface R2Target {
  client: S3Client;
  bucket: string;
}

function r2Target(): R2Target {
  if (!process.env.R2_ACCOUNT_ID || !process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY) {
    throw new ServiceUnavailableException('R2 storage is not configured. Add R2_* env vars.');
  }
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { S3Client: Client } = require('@aws-sdk/client-s3');
  const client: S3Client = new Client({
    endpoint: process.env.R2_ENDPOINT ?? `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    region: 'auto',
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
  });
  const bucket = process.env.R2_BUCKET ?? process.env.R2_BUCKET_NAME ?? process.env.R2_ACCOUNT_ID;
  return { client, bucket };
}

function newAudioKey(contentType: string): string {
  const ext = AUDIO_EXT[contentType] ?? 'bin';
  return `sermons/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
}

function publicAudioUrl(key: string): string {
  const publicUrl = (process.env.R2_PUBLIC_URL ?? '').replace(/\/$/, '');
  return publicUrl ? `${publicUrl}/${key}` : key;
}

@ApiTags('sermons')
@Controller('sermons')
export class SermonsUploadController {
  constructor(private readonly sermonsAuth: SermonsAuthService) {}

  /**
   * A one-time link the browser uploads the recording to, straight into R2.
   *
   * Sermon recordings run to hundreds of MB, but a request through the
   * website (Vercel) or the API (Cloud Run) is capped at a few tens of MB, so
   * the file can't pass through either. The API only authorises the upload:
   * the link is signed for this exact content type and byte size (up to
   * 1 GB), so it can't be reused for a different or larger file.
   */
  @Post('audio-upload-url')
  @Roles(Role.MEMBER)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get a direct-to-storage upload link for sermon audio, up to 1 GB (PASTOR+ or Audio Production)' })
  @ApiOkResponse({ description: 'PUT the file to uploadUrl with the given headers, then save audioUrl on the sermon' })
  async audioUploadUrl(@CurrentUser() actor: AuthUser, @Body() dto: AudioUploadUrlDto) {
    await this.sermonsAuth.requireManage(actor);

    const { client, bucket } = r2Target();
    const key = newAudioKey(dto.contentType);
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { PutObjectCommand } = require('@aws-sdk/client-s3');
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
      const uploadUrl: string = await getSignedUrl(
        client,
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          ContentType: dto.contentType,
          ContentLength: dto.size,
          CacheControl: CACHE_CONTROL,
        }),
        {
          expiresIn: UPLOAD_URL_TTL_SECONDS,
          // Bind the link to this file: R2 rejects a PUT whose type or size differs.
          signableHeaders: new Set(['content-type', 'content-length', 'cache-control']),
        },
      );
      return {
        uploadUrl,
        headers: { 'Content-Type': dto.contentType, 'Cache-Control': CACHE_CONTROL },
        audioUrl: publicAudioUrl(key),
        audioKey: key,
        maxBytes: MAX_DIRECT_AUDIO_BYTES,
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      throw new InternalServerErrorException(`Could not prepare the upload: ${msg}`);
    }
  }

  @Post('upload-audio')
  @Roles(Role.MEMBER)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_PROXIED_AUDIO_BYTES, files: 1 },
    }),
  )
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Upload sermon audio through the API (PASTOR+ or Audio Production)',
    description: 'Small files only. Large recordings use /sermons/audio-upload-url and go straight to R2.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary', description: 'Audio file to upload' },
      },
    },
  })
  @ApiCreatedResponse({ description: 'Audio uploaded successfully' })
  async uploadAudio(
    @CurrentUser() actor: AuthUser,
    @UploadedFile() file: { buffer: Buffer; mimetype: string; originalname: string; size: number } | undefined,
  ) {
    await this.sermonsAuth.requireManage(actor);

    if (!file) {
      throw new BadRequestException('No file provided');
    }

    if (file.size > MAX_PROXIED_AUDIO_BYTES) {
      throw new BadRequestException('File must be under 100 MB');
    }

    if (!AUDIO_MIME.includes(file.mimetype)) {
      throw new BadRequestException('Unsupported audio format');
    }
    if (!hasValidFileSignature(file)) {
      throw new BadRequestException('Audio content does not match its declared format');
    }

    const { client, bucket } = r2Target();
    const key = newAudioKey(file.mimetype);

    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { PutObjectCommand } = require('@aws-sdk/client-s3');
      await client.send(new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        CacheControl: CACHE_CONTROL,
      }));
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      throw new InternalServerErrorException(`Upload to R2 failed: ${msg}`);
    }

    // Return the bare payload — the global ResponseEnvelopeInterceptor wraps it in
    // { data, meta }. Returning { data: ... } here would double-wrap and the frontend
    // would read res.data.audioUrl as undefined. (Matches /uploads/image.)
    return { audioUrl: publicAudioUrl(key), audioKey: key };
  }
}
