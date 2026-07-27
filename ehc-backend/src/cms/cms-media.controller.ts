import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import type { AuthUser } from '../auth/types/auth-user';
import { CmsMediaService } from './services/cms-media.service';
import { CmsAuditService } from './services/cms-audit.service';

@ApiTags('cms')
@Controller('cms')
export class CmsMediaController {
  constructor(
    private readonly media: CmsMediaService,
    private readonly audit: CmsAuditService,
  ) {}

  @Roles(Role.PASTOR)
  @ApiBearerAuth('access-token')
  @Get('media')
  @ApiOperation({ summary: 'List media assets (PASTOR+)' })
  listMedia() {
    return this.media.listMedia();
  }

  @Roles(Role.PASTOR)
  @ApiBearerAuth('access-token')
  @Post('media')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a media asset to R2 (alt text required) (PASTOR+)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        alt: { type: 'string' },
        width: { type: 'number' },
        height: { type: 'number' },
      },
    },
  })
  uploadMedia(
    @CurrentUser() actor: AuthUser,
    @UploadedFile()
    file: { buffer: Buffer; mimetype: string; originalname: string; size: number } | undefined,
    @Body() body: { alt?: string; width?: string; height?: string },
  ) {
    if (!file) throw new BadRequestException('No file provided');
    return this.media.uploadMedia(
      file,
      {
        alt: body.alt ?? '',
        width: body.width ? Number(body.width) : undefined,
        height: body.height ? Number(body.height) : undefined,
      },
      actor.userId,
    );
  }

  @Roles(Role.PASTOR)
  @ApiBearerAuth('access-token')
  @Delete('media/:id')
  @ApiOperation({ summary: 'Delete a media asset (PASTOR+)' })
  deleteMedia(@CurrentUser() actor: AuthUser, @Param('id') id: string) {
    return this.media.deleteMedia(id, actor.userId);
  }

  @Roles(Role.PASTOR)
  @ApiBearerAuth('access-token')
  @Get('audit')
  @ApiOperation({ summary: 'Recent CMS audit-log entries (PASTOR+)' })
  listAudit(@Query('limit') limit?: string) {
    return this.audit.list(limit ? Number(limit) : 50);
  }
}
