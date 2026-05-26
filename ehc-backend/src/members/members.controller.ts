import { Controller, Post, Param, Req, Get, Query, Patch, Body, Delete } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiOkResponse, ApiQuery, ApiBody } from '@nestjs/swagger';
import { MembersService } from './members.service';
import { AuthService } from '../auth/auth.service';

@ApiTags('members')
@Controller('members')
export class MembersController {
  constructor(private readonly membersService: MembersService, private readonly authService: AuthService) {}

  @Post('convert-visitor/:visitorId')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Convert a visitor to a member' })
  @ApiOkResponse({
    description: 'Created member object',
    schema: {
      example: {
        id: 'd290f1ee-6c54-4b01-90e6-d701748f0851',
        tenantId: 'default-tenant',
        profileId: 'profile-uuid',
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane.doe@example.com',
        phone: '+2348012345678',
        dateOfBirth: '1990-01-01T00:00:00.000Z',
        address: '12 Chapel Street, Ibadan',
        joinedAt: '2026-05-26T12:00:00.000Z',
        status: 'ACTIVE',
        notifyNewSermons: true,
      },
    },
  })
  async convertVisitor(@Req() request: { headers?: { authorization?: string } }, @Param('visitorId') visitorId: string) {
    await this.authService.getProfile(request.headers?.authorization);
    return this.membersService.convertVisitorToMember(visitorId);
  }

  @Get()
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'List members' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiOkResponse({ description: 'Array of members', schema: { example: [{ id: 'id', firstName: 'Jane', lastName: 'Doe', email: 'jane@example.com', phone: '+234801234' }] } })
  async list(@Req() request: { headers?: { authorization?: string } }, @Query('search') search?: string, @Query('status') status?: string) {
    await this.authService.getProfile(request.headers?.authorization);
    return this.membersService.getAllMembers({ search, status });
  }

  @Get(':id')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get member by id' })
  @ApiOkResponse({ description: 'Member detail', schema: { example: { id: 'id', firstName: 'Jane', lastName: 'Doe', email: 'jane@example.com', AttendanceRecord: [] } } })
  async getById(@Req() request: { headers?: { authorization?: string } }, @Param('id') id: string) {
    await this.authService.getProfile(request.headers?.authorization);
    return this.membersService.getMemberById(id);
  }

  @Patch(':id/status')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update member status' })
  @ApiBody({ schema: { example: { status: 'ACTIVE' } } })
  @ApiOkResponse({ description: 'Updated member' })
  async updateStatus(@Req() request: { headers?: { authorization?: string } }, @Param('id') id: string, @Body('status') status: string) {
    await this.authService.getProfile(request.headers?.authorization);
    return this.membersService.updateMemberStatus(id, status);
  }

  @Get('birthdays/upcoming')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Upcoming birthdays' })
  @ApiQuery({ name: 'daysAhead', required: false })
  async upcomingBirthdays(@Req() request: { headers?: { authorization?: string } }, @Query('daysAhead') daysAhead?: string) {
    await this.authService.getProfile(request.headers?.authorization);
    return this.membersService.getUpcomingBirthdays(Number(daysAhead) || 7);
  }

  @Get('birthdays/today')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Today birthdays' })
  async todayBirthdays(@Req() request: { headers?: { authorization?: string } }) {
    await this.authService.getProfile(request.headers?.authorization);
    return this.membersService.getTodayBirthdays();
  }

  @Get('absent')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Absent members' })
  @ApiQuery({ name: 'missedSundays', required: false })
  async absent(@Req() request: { headers?: { authorization?: string } }, @Query('missedSundays') missedSundays?: string) {
    await this.authService.getProfile(request.headers?.authorization);
    return this.membersService.getAbsentMembers(Number(missedSundays) || 3);
  }

  @Post(':id/pastor-note')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Add pastor note for a member' })
  @ApiBody({ schema: { example: { content: 'Pastor note content' } } })
  async addPastorNote(@Req() request: { headers?: { authorization?: string } }, @Param('id') id: string, @Body('content') content: string) {
    await this.authService.getProfile(request.headers?.authorization);
    return this.membersService.addPastorNote(id, content);
  }

  @Delete('pastor-note/:noteId')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Delete pastor note' })
  async deletePastorNote(@Req() request: { headers?: { authorization?: string } }, @Param('noteId') noteId: string) {
    await this.authService.getProfile(request.headers?.authorization);
    return this.membersService.deletePastorNote(noteId);
  }

  @Post(':id/follow-up')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Add follow-up task for a member' })
  @ApiBody({ schema: { example: { title: 'Call member', dueDate: '2026-06-01' } } })
  async addFollowUp(@Req() request: { headers?: { authorization?: string } }, @Param('id') id: string, @Body() body: any) {
    await this.authService.getProfile(request.headers?.authorization);
    return this.membersService.addFollowUpTask(id, body.title, body.dueDate);
  }

  @Patch('follow-up/:taskId')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Toggle follow-up task done' })
  @ApiBody({ schema: { example: { done: true } } })
  async toggleFollowUp(@Req() request: { headers?: { authorization?: string } }, @Param('taskId') taskId: string, @Body('done') done: boolean) {
    await this.authService.getProfile(request.headers?.authorization);
    return this.membersService.toggleFollowUpTask(taskId, !!done);
  }

  @Delete('follow-up/:taskId')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Delete follow-up task' })
  async deleteFollowUp(@Req() request: { headers?: { authorization?: string } }, @Param('taskId') taskId: string) {
    await this.authService.getProfile(request.headers?.authorization);
    return this.membersService.deleteFollowUpTask(taskId);
  }
}
