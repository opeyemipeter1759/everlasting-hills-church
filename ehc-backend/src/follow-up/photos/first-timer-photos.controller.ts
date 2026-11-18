import { Body, Controller, Delete, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Role } from '@prisma/client';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import type { AuthUser } from '../../auth/types/auth-user';
import { parseSchema } from '../../common/zod-parse.util';
import { photoConfirmSchema, photoUploadSchema } from './first-timer-photo.schema';
import { FirstTimerPhotosService } from './first-timer-photos.service';

/**
 * A first-timer's photo. Thin: validate with Zod, delegate to the service,
 * which checks the follow-up team gate and that the person is on record.
 */
@ApiTags('follow-up')
@Controller('follow-up/first-timers/:visitorId/photo')
@Roles(Role.MEMBER)
@ApiBearerAuth('access-token')
export class FirstTimerPhotosController {
  constructor(private readonly photos: FirstTimerPhotosService) {}

  @Post('upload-url')
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @ApiOperation({ summary: 'A one-time link to upload their photo straight to storage (WebP, JPEG or PNG, 5 MB at most)' })
  async uploadUrl(@CurrentUser() actor: AuthUser, @Param('visitorId') visitorId: string, @Body() body: unknown) {
    return this.photos.uploadUrl(actor, visitorId, parseSchema(photoUploadSchema, body));
  }

  @Post()
  @ApiOperation({ summary: 'Put an uploaded photo on their record, replacing (and deleting) any earlier one' })
  async confirm(@CurrentUser() actor: AuthUser, @Param('visitorId') visitorId: string, @Body() body: unknown) {
    return this.photos.confirm(actor, visitorId, parseSchema(photoConfirmSchema, body).key);
  }

  @Delete()
  @ApiOperation({ summary: 'Remove their photo from their record and from storage' })
  async remove(@CurrentUser() actor: AuthUser, @Param('visitorId') visitorId: string) {
    return this.photos.remove(actor, visitorId);
  }
}
