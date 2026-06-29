import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiNoContentResponse, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import type { Response } from 'express';
import { Res } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import type { AuthUser } from '../auth/types/auth-user';
import { UpdateMyProfileDto } from './dto/update-my-profile.dto';
import { MembersService, type DirectoryQuery } from './members.service';
import { BulkImportDto } from './dto/bulk-import.dto';
import { SetTagsDto } from './dto/set-tags.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { BulkMemberOpDto } from './dto/bulk-member-op.dto';

/**
 * Members module.
 *
 * Every route below requires authentication (global JwtAuthGuard) and ADMIN+ role.
 * The previous code called `authService.getProfile(authorization)` on every request, which
 * round-tripped to Supabase's /auth/v1/user endpoint each time — that's a network hop per
 * request added on top of the local JWT verification. We've replaced that with the
 * declarative @Roles guard which uses the role already resolved by JwtStrategy.
 *
 * Performance: removed N+1 Supabase API call per request.
 */
@ApiTags('members')
@Controller('members')
@Roles(Role.ADMIN)
@ApiBearerAuth('access-token')
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @Post('convert-visitor/:visitorId')
  @ApiOperation({ summary: 'Convert a visitor to a member' })
  @ApiOkResponse({
    description: 'Created member object',
    schema: {
      example: {
        id: 'd290f1ee-6c54-4b01-90e6-d701748f0851',
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane.doe@example.com',
        joinedAt: '2026-05-26T12:00:00.000Z',
        status: 'ACTIVE',
      },
    },
  })
  async convertVisitor(@Param('visitorId') visitorId: string) {
    return this.membersService.convertVisitorToMember(visitorId);
  }

  @Post('import')
  @ApiOperation({ summary: 'Bulk-import members from CSV rows' })
  async bulkImport(@Body() body: BulkImportDto) {
    return this.membersService.bulkImport(body.rows, body.sendWelcome ?? false);
  }

  @Patch(':id/tags')
  @ApiOperation({ summary: "Replace a member's tags" })
  async setTags(@Param('id') id: string, @Body() body: SetTagsDto) {
    return this.membersService.setTags(id, body.tags);
  }

  @Get()
  @ApiOperation({ summary: 'List members' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'status', required: false })
  async list(@Query('search') search?: string, @Query('status') status?: string) {
    return this.membersService.getAllMembers({ search, status });
  }

  @Get('directory')
  @ApiOperation({ summary: 'Unified People directory — paginated, filtered, sorted (ADMIN+)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'role', required: false, enum: Role })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'gender', required: false, enum: ['MALE', 'FEMALE'] })
  @ApiQuery({ name: 'unit', required: false })
  @ApiQuery({ name: 'hasUnit', required: false, enum: ['true', 'false'] })
  @ApiQuery({ name: 'joinedFrom', required: false })
  @ApiQuery({ name: 'joinedTo', required: false })
  @ApiQuery({ name: 'birthMonth', required: false, type: Number })
  @ApiQuery({ name: 'sortBy', required: false, enum: ['name', 'joinedAt', 'role', 'status'] })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  async directory(@Query() q: DirectoryQuery) {
    return this.membersService.getDirectory(q);
  }

  @Get('export')
  @ApiOperation({ summary: 'Export the filtered People directory as Excel (ADMIN+)' })
  async exportDirectory(@Query() q: DirectoryQuery, @Res() res: Response) {
    const buffer = await this.membersService.exportDirectory(q);
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', 'attachment; filename="people-export.xlsx"');
    res.send(buffer);
  }

  @Patch('bulk')
  @ApiOperation({ summary: 'Bulk status / tag operation on member ids (ADMIN+)' })
  @ApiBody({ type: BulkMemberOpDto })
  async bulkOp(@Body() body: BulkMemberOpDto) {
    return this.membersService.bulkMemberOp(body);
  }

  /**
   * Note on route order: specific paths like /birthdays/upcoming, /birthdays/today, /absent
   * are declared BEFORE the /:id catch-all so Express doesn't match them against /:id.
   */
  @Get('birthdays/upcoming')
  @ApiOperation({ summary: 'Upcoming birthdays' })
  @ApiQuery({ name: 'daysAhead', required: false })
  async upcomingBirthdays(@Query('daysAhead') daysAhead?: string) {
    return this.membersService.getUpcomingBirthdays(Number(daysAhead) || 7);
  }

  @Get('birthdays/today')
  @ApiOperation({ summary: 'Today birthdays' })
  async todayBirthdays() {
    return this.membersService.getTodayBirthdays();
  }

  @Get('absent')
  @ApiOperation({ summary: 'Absent members' })
  @ApiQuery({ name: 'missedSundays', required: false })
  async absent(@Query('missedSundays') missedSundays?: string) {
    return this.membersService.getAbsentMembers(Number(missedSundays) || 3);
  }

  @Get('at-risk')
  @ApiOperation({ summary: 'Members at risk — consecutive absences, never attended, below 50% rate (ADMIN+)' })
  @ApiOkResponse({
    schema: {
      example: {
        absentConsecutiveWeeks: [{ userId: 'uuid', userName: 'Emeka Nwosu', consecutiveAbsences: 3, lastSeen: null }],
        neverAttended: [{ userId: 'uuid', userName: 'Tolu Bello', joinedAt: '2026-06-01' }],
        belowFiftyPercent: [{ userId: 'uuid', userName: 'Sade Kalu', presentCount: 3, totalCount: 10, rate: 0.3 }],
      },
    },
  })
  getAtRisk() {
    return this.membersService.getMembersAtRisk();
  }

  /**
   * Self-service routes — any signed-in user can update their own profile.
   * Declared BEFORE the `:id` routes so Express does not match the literal "me" as an id.
   */
  @Patch('me')
  @Roles(Role.MEMBER)
  @ApiOperation({ summary: 'Update my profile' })
  @ApiBody({ type: UpdateMyProfileDto })
  @ApiOkResponse({ description: 'Updated member' })
  async updateMyProfile(
    @CurrentUser() actor: AuthUser,
    @Body() body: UpdateMyProfileDto,
  ) {
    return this.membersService.updateMyProfile(actor.userId, body, actor.email);
  }

  @Post('me/avatar')
  @Roles(Role.MEMBER)
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
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
    return this.membersService.setMyAvatar(actor.userId, file, actor.email);
  }

  @Delete('me/avatar')
  @Roles(Role.MEMBER)
  @ApiOperation({ summary: 'Remove my profile photo' })
  async clearMyAvatar(@CurrentUser() actor: AuthUser) {
    return this.membersService.clearMyAvatar(actor.userId, actor.email);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get member by id' })
  async getById(@Param('id') id: string) {
    return this.membersService.getMemberById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: "Admin edit of a member's core fields (ADMIN+)" })
  @ApiBody({ type: UpdateMemberDto })
  async updateMember(@Param('id') id: string, @Body() body: UpdateMemberDto) {
    return this.membersService.updateMemberDetails(id, body);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update member status' })
  @ApiBody({ schema: { example: { status: 'ACTIVE' } } })
  async updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.membersService.updateMemberStatus(id, status);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Permanently delete a member',
    description:
      'Removes the Member, their Profile, all related records (attendance, notes, follow-ups, etc.), and their Supabase auth user. Actor role must out-rank the target.',
  })
  @ApiNoContentResponse({ description: 'Member fully removed' })
  async deleteMember(@CurrentUser() actor: AuthUser, @Param('id') id: string) {
    return this.membersService.deleteMember(actor, id);
  }

  @Post(':id/pastor-note')
  @Roles(Role.PASTOR)
  @ApiOperation({ summary: 'Add pastor note for a member (PASTOR+)' })
  @ApiBody({ schema: { example: { content: 'Pastor note content' } } })
  async addPastorNote(@Param('id') id: string, @Body('content') content: string) {
    return this.membersService.addPastorNote(id, content);
  }

  @Delete('pastor-note/:noteId')
  @Roles(Role.PASTOR)
  @ApiOperation({ summary: 'Delete pastor note (PASTOR+)' })
  async deletePastorNote(@Param('noteId') noteId: string) {
    return this.membersService.deletePastorNote(noteId);
  }

  @Post(':id/follow-up')
  @ApiOperation({ summary: 'Add follow-up task for a member' })
  @ApiBody({ schema: { example: { title: 'Call member', dueDate: '2026-06-01' } } })
  async addFollowUp(
    @Param('id') id: string,
    @Body() body: { title: string; dueDate?: string },
  ) {
    return this.membersService.addFollowUpTask(id, body.title, body.dueDate);
  }

  @Patch('follow-up/:taskId')
  @ApiOperation({ summary: 'Toggle follow-up task done' })
  @ApiBody({ schema: { example: { done: true } } })
  async toggleFollowUp(@Param('taskId') taskId: string, @Body('done') done: boolean) {
    return this.membersService.toggleFollowUpTask(taskId, !!done);
  }

  @Delete('follow-up/:taskId')
  @ApiOperation({ summary: 'Delete follow-up task' })
  async deleteFollowUp(@Param('taskId') taskId: string) {
    return this.membersService.deleteFollowUpTask(taskId);
  }
}
