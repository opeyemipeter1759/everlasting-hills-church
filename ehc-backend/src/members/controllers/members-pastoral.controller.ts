import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../../auth/decorators/roles.decorator';
import { MemberBirthdaysService } from '../services/member-birthdays.service';
import { MemberPastoralCareService } from '../services/member-pastoral-care.service';
import { MemberRiskService } from '../services/member-risk.service';

/**
 * Pastoral oversight: birthdays, absenteeism/at-risk reporting, pastor notes, follow-up tasks.
 *
 * Registered before MembersController (which owns the GET /:id catch-all) so that
 * GET /members/absent, /members/at-risk, /members/follow-ups resolve here.
 */
@ApiTags('members')
@Controller('members')
@Roles(Role.ADMIN)
@ApiBearerAuth('access-token')
export class MembersPastoralController {
  constructor(
    private readonly birthdays: MemberBirthdaysService,
    private readonly pastoralCare: MemberPastoralCareService,
    private readonly risk: MemberRiskService,
  ) {}

  @Get('birthdays/upcoming')
  @ApiOperation({ summary: 'Upcoming birthdays' })
  @ApiQuery({ name: 'daysAhead', required: false })
  async upcomingBirthdays(@Query('daysAhead') daysAhead?: string) {
    return this.birthdays.getUpcomingBirthdays(Number(daysAhead) || 7);
  }

  @Get('birthdays/today')
  @ApiOperation({ summary: 'Today birthdays' })
  async todayBirthdays() {
    return this.birthdays.getTodayBirthdays();
  }

  @Get('absent')
  @ApiOperation({ summary: 'Absent members' })
  @ApiQuery({ name: 'missedSundays', required: false })
  async absent(@Query('missedSundays') missedSundays?: string) {
    return this.pastoralCare.getAbsentMembers(Number(missedSundays) || 3);
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
    return this.risk.getMembersAtRisk();
  }

  @Get('follow-ups')
  @ApiOperation({ summary: 'All open follow-up tasks org-wide, with assigned leader (ADMIN+)' })
  getOpenFollowUps() {
    return this.pastoralCare.listOpenFollowUpTasks();
  }

  @Post(':id/pastor-note')
  @Roles(Role.PASTOR)
  @ApiOperation({ summary: 'Add pastor note for a member (PASTOR+)' })
  @ApiBody({ schema: { example: { content: 'Pastor note content' } } })
  async addPastorNote(@Param('id') id: string, @Body('content') content: string) {
    return this.pastoralCare.addPastorNote(id, content);
  }

  @Delete('pastor-note/:noteId')
  @Roles(Role.PASTOR)
  @ApiOperation({ summary: 'Delete pastor note (PASTOR+)' })
  async deletePastorNote(@Param('noteId') noteId: string) {
    return this.pastoralCare.deletePastorNote(noteId);
  }

  @Post(':id/follow-up')
  @ApiOperation({ summary: 'Add follow-up task for a member' })
  @ApiBody({ schema: { example: { title: 'Call member', dueDate: '2026-06-01' } } })
  async addFollowUp(
    @Param('id') id: string,
    @Body() body: { title: string; dueDate?: string },
  ) {
    return this.pastoralCare.addFollowUpTask(id, body.title, body.dueDate);
  }

  @Patch('follow-up/:taskId')
  @ApiOperation({ summary: 'Toggle follow-up task done' })
  @ApiBody({ schema: { example: { done: true } } })
  async toggleFollowUp(@Param('taskId') taskId: string, @Body('done') done: boolean) {
    return this.pastoralCare.toggleFollowUpTask(taskId, !!done);
  }

  @Delete('follow-up/:taskId')
  @ApiOperation({ summary: 'Delete follow-up task' })
  async deleteFollowUp(@Param('taskId') taskId: string) {
    return this.pastoralCare.deleteFollowUpTask(taskId);
  }
}
