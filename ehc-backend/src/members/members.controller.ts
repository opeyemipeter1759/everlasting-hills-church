import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { MembersService } from './members.service';

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

  @Get()
  @ApiOperation({ summary: 'List members' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'status', required: false })
  async list(@Query('search') search?: string, @Query('status') status?: string) {
    return this.membersService.getAllMembers({ search, status });
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

  @Get(':id')
  @ApiOperation({ summary: 'Get member by id' })
  async getById(@Param('id') id: string) {
    return this.membersService.getMemberById(id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update member status' })
  @ApiBody({ schema: { example: { status: 'ACTIVE' } } })
  async updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.membersService.updateMemberStatus(id, status);
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
