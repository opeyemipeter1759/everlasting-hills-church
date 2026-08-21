import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import type { AuthUser } from '../../auth/types/auth-user';
import { UpdateMyProfileDto } from '../dto/update-my-profile.dto';
import { MemberProfileService } from '../services/member-profile.service';
import { MemberAvatarService } from '../services/member-avatar.service';
import { MemberDeactivationService } from '../services/member-deactivation.service';
import { MemberSearchService } from '../services/member-search.service';

/**
 * Self-service routes — any signed-in MEMBER can manage their own profile.
 *
 * Registered before MembersController (which owns the GET /:id catch-all) so that
 * GET /members/search resolves here rather than being swallowed as `:id = "search"`.
 */
@ApiTags('members')
@Controller('members')
@Roles(Role.ADMIN)
@ApiBearerAuth('access-token')
export class MembersSelfServiceController {
  constructor(
    private readonly profile: MemberProfileService,
    private readonly avatar: MemberAvatarService,
    private readonly deactivation: MemberDeactivationService,
    private readonly search: MemberSearchService,
  ) {}

  @Get('search')
  @Roles(Role.MEMBER)
  @ApiOperation({ summary: 'Search active members by name — for "pick a person" pickers (MEMBER+)' })
  @ApiQuery({ name: 'q', required: true })
  async search_(@Query('q') q: string, @CurrentUser() actor: AuthUser) {
    return this.search.searchMembersForPicker(q ?? '', actor.userId);
  }

  @Post('me/avatar')
  @Roles(Role.MEMBER)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 1024 * 1024, files: 1 },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload my profile photo (PNG/JPG/JPEG, ≤ 1 MB)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @ApiOkResponse({ description: 'Uploaded; returns the new public photoUrl' })
  async uploadMyAvatar(
    @CurrentUser() actor: AuthUser,
    @UploadedFile()
    file:
      | { buffer: Buffer; mimetype: string; originalname: string; size: number }
      | undefined,
  ) {
    if (!file) throw new BadRequestException('No file provided');
    return this.avatar.setMyAvatar(actor.userId, file, actor.email);
  }

  @Delete('me/avatar')
  @Roles(Role.MEMBER)
  @ApiOperation({ summary: 'Remove my profile photo' })
  async clearMyAvatar(@CurrentUser() actor: AuthUser) {
    return this.avatar.clearMyAvatar(actor.userId, actor.email);
  }

  @Post('me/deactivate')
  @Roles(Role.MEMBER)
  @ApiOperation({ summary: 'Request deactivation of my own account' })
  @ApiOkResponse({
    description: 'Account deactivated; reversible within the stated window',
    schema: { example: { success: true, status: 'INACTIVE', reversalDays: 14 } },
  })
  async deactivateMe(@CurrentUser() actor: AuthUser) {
    return this.deactivation.requestDeactivation(actor.userId, actor.email);
  }

  @Post('me/reactivate')
  @Roles(Role.MEMBER)
  @ApiOperation({ summary: 'Reactivate my own (self-deactivated) account' })
  async reactivateMe(@CurrentUser() actor: AuthUser) {
    return this.deactivation.reactivateMe(actor.userId, actor.email);
  }

  @Patch('me')
  @Roles(Role.MEMBER)
  @ApiOperation({ summary: 'Update my profile' })
  @ApiBody({ type: UpdateMyProfileDto })
  @ApiOkResponse({ description: 'Updated member' })
  async updateMyProfile(
    @CurrentUser() actor: AuthUser,
    @Body() body: UpdateMyProfileDto,
  ) {
    return this.profile.updateMyProfile(actor.userId, body, actor.email);
  }
}
