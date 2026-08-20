import {
  BadRequestException,
  Controller,
  InternalServerErrorException,
  Post,
  ServiceUnavailableException,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiCreatedResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../../auth/decorators/roles.decorator';
import { hasValidFileSignature } from '../../uploads/file-signature.util';

const MAX_AUDIO_BYTES = 100 * 1024 * 1024;
const AUDIO_MIME = ['audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/ogg', 'audio/aac'];
const AUDIO_EXT: Record<string, string> = {
  'audio/mpeg': 'mp3',
  'audio/mp4': 'm4a',
  'audio/wav': 'wav',
  'audio/ogg': 'ogg',
  'audio/aac': 'aac',
};

@ApiTags('sermons')
@Controller('sermons')
export class SermonsUploadController {
  @Post('upload-audio')
  @Roles(Role.PASTOR)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_AUDIO_BYTES, files: 1 },
    }),
  )
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Upload sermon audio', description: 'Uploads an audio file to R2 and returns a public URL.' })
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
    @UploadedFile() file: { buffer: Buffer; mimetype: string; originalname: string; size: number } | undefined,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    if (file.size > MAX_AUDIO_BYTES) {
      throw new BadRequestException('File must be under 100 MB');
    }

    if (!AUDIO_MIME.includes(file.mimetype)) {
      throw new BadRequestException('Unsupported audio format');
    }
    if (!hasValidFileSignature(file)) {
      throw new BadRequestException('Audio content does not match its declared format');
    }

    if (!process.env.R2_ACCOUNT_ID || !process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY) {
      throw new ServiceUnavailableException('R2 storage is not configured. Add R2_* env vars.');
    }

    const ext = AUDIO_EXT[file.mimetype] ?? 'bin';
    const key = `sermons/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

      const endpoint = process.env.R2_ENDPOINT ?? `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
      const bucket = process.env.R2_BUCKET ?? process.env.R2_BUCKET_NAME ?? process.env.R2_ACCOUNT_ID;

      const client = new S3Client({
        endpoint,
        region: 'auto',
        credentials: {
          accessKeyId: process.env.R2_ACCESS_KEY_ID,
          secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
        },
      });

      await client.send(new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      }));
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      throw new InternalServerErrorException(`Upload to R2 failed: ${msg}`);
    }

    const publicUrl = (process.env.R2_PUBLIC_URL ?? '').replace(/\/$/, '');
    const audioUrl = publicUrl ? `${publicUrl}/${key}` : key;
    // Return the bare payload — the global ResponseEnvelopeInterceptor wraps it in
    // { data, meta }. Returning { data: ... } here would double-wrap and the frontend
    // would read res.data.audioUrl as undefined. (Matches /uploads/image.)
    return { audioUrl, audioKey: key };
  }
}
