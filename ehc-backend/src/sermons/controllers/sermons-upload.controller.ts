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

@ApiTags('sermons')
@Controller('sermons')
export class SermonsUploadController {
  @Post('upload-audio')
  @Roles(Role.PASTOR)
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
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

    const maxBytes = 100 * 1024 * 1024; // 100 MB
    if (file.size > maxBytes) {
      throw new BadRequestException('File must be under 100 MB');
    }

    const allowed = ['audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/ogg', 'audio/aac'];
    if (!allowed.includes(file.mimetype)) {
      throw new BadRequestException('Unsupported audio format');
    }

    if (!process.env.R2_ACCOUNT_ID || !process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY) {
      throw new ServiceUnavailableException('R2 storage is not configured. Add R2_* env vars.');
    }

    const ext = (file.originalname || '').split('.').pop() ?? 'mp3';
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
        CacheControl: 'public, max-age=31536000, immutable',
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
