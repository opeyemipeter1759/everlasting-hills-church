import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Query,
  Res,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiNoContentResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import type { Response } from 'express';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import type { AuthUser } from '../auth/types/auth-user';
import type { DirectoryQuery } from './members.types';
import { SetTagsDto } from './dto/set-tags.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { BulkMemberOpDto } from './dto/bulk-member-op.dto';
import { MemberBulkOpsService } from './services/member-bulk-ops.service';
import { MemberSearchService } from './services/member-search.service';
import { MemberDirectoryService } from './services/member-directory.service';
import { MemberExportService } from './services/member-export.service';
import { MemberCrudService } from './services/member-crud.service';
import { MemberDeletionService } from './services/member-deletion.service';

/**
 * Members module — core directory/CRUD.
 *
 * Every route below requires authentication (global JwtAuthGuard) and ADMIN+ role.
 * Onboarding (convert-visitor/import), self-service (me/*, search), and pastoral
 * (birthdays/absent/at-risk/follow-ups/pastor-note) routes live in sibling controllers
 * registered BEFORE this one in members.module.ts, since this controller owns the
 * GET /:id catch-all — it must be last so specific paths don't get swallowed by it.
 */
@ApiTags('members')
@Controller('members')
@Roles(Role.ADMIN)
@ApiBearerAuth('access-token')
export class MembersController {
  constructor(
    private readonly bulkOps: MemberBulkOpsService,
    private readonly search: MemberSearchService,
    private readonly directory: MemberDirectoryService,
    private readonly exportSvc: MemberExportService,
    private readonly crud: MemberCrudService,
    private readonly deletion: MemberDeletionService,
  ) {}

  @Patch(':id/tags')
  @ApiOperation({ summary: "Replace a member's tags" })
  async setTags(@Param('id') id: string, @Body() body: SetTagsDto) {
    return this.bulkOps.setTags(id, body.tags);
  }

  @Get()
  @ApiOperation({ summary: 'List members' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'status', required: false })
  async list(@Query('search') search?: string, @Query('status') status?: string) {
    return this.search.getAllMembers({ search, status });
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
  async directoryList(@Query() q: DirectoryQuery) {
    return this.directory.getDirectory(q);
  }

  @Get('export')
  @ApiOperation({ summary: 'Export the filtered People directory as Excel (ADMIN+)' })
  async exportDirectory(@Query() q: DirectoryQuery, @Res() res: Response) {
    const buffer = await this.exportSvc.exportDirectory(q);
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
    return this.bulkOps.bulkMemberOp(body);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get member by id' })
  async getById(@Param('id') id: string) {
    return this.crud.getMemberById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: "Admin edit of a member's core fields (ADMIN+)" })
  @ApiBody({ type: UpdateMemberDto })
  async updateMember(@Param('id') id: string, @Body() body: UpdateMemberDto) {
    return this.crud.updateMemberDetails(id, body);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update member status' })
  @ApiBody({ schema: { example: { status: 'ACTIVE' } } })
  async updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.crud.updateMemberStatus(id, status);
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
    return this.deletion.deleteMember(actor, id);
  }
}
