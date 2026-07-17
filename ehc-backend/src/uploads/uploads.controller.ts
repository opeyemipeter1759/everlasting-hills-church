import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { UploadsService } from './uploads.service';

const IMAGE_MIME = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
];
const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8 MB

const DOCUMENT_MIME = [
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/msword', // legacy .doc
  'application/pdf',
];
const MAX_DOCUMENT_BYTES = 15 * 1024 * 1024; // 15 MB

/**
 * Shared upload endpoints. Image upload backs both the homepage CMS
 * (hero/gallery images) and sermon thumbnails.
 *
 * @Roles(Role.ADMIN) is hierarchical (see RolesGuard) — ADMIN, PASTOR, and
 * SUPER_ADMIN all pass, which covers CMS editors and sermon authors alike.
 */
@ApiTags('uploads')
@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploads: UploadsService) {}

  @Post('image')
  @Roles(Role.ADMIN)
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Upload an image',
    description:
      'Uploads an image to R2 and returns its public URL. Used by the homepage CMS and sermon thumbnails.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Image file (JPG, PNG, WebP, GIF, AVIF — max 8 MB)',
        },
      },
    },
  })
  @ApiCreatedResponse({ description: 'Image uploaded successfully' })
  async uploadImage(
    @UploadedFile()
    file:
      | { buffer: Buffer; mimetype: string; originalname: string; size: number }
      | undefined,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }
    if (file.size > MAX_IMAGE_BYTES) {
      throw new BadRequestException('Image must be under 8 MB');
    }
    if (!IMAGE_MIME.includes(file.mimetype)) {
      throw new BadRequestException('Unsupported image format (use JPG, PNG, WebP, GIF, or AVIF)');
    }

    // Return the bare payload — the global ResponseEnvelopeInterceptor wraps it
    // in { data, meta }, which the frontend axios client unwraps to { url, key }.
    return this.uploads.uploadObject(file, 'images');
  }

  @Post('document')
  @Roles(Role.UNIT_LEAD)
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Upload a document',
    description:
      'Uploads a document (docx/doc/pdf) to R2 and returns its public URL. Used by Report attachments.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Document file (DOCX, DOC, or PDF — max 15 MB)',
        },
      },
    },
  })
  @ApiCreatedResponse({ description: 'Document uploaded successfully' })
  async uploadDocument(
    @UploadedFile()
    file:
      | { buffer: Buffer; mimetype: string; originalname: string; size: number }
      | undefined,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }
    if (file.size > MAX_DOCUMENT_BYTES) {
      throw new BadRequestException('Document must be under 15 MB');
    }
    if (!DOCUMENT_MIME.includes(file.mimetype)) {
      throw new BadRequestException('Unsupported document format (use DOCX, DOC, or PDF)');
    }

    const result = await this.uploads.uploadObject(file, 'documents');
    return { ...result, name: file.originalname };
  }
}
