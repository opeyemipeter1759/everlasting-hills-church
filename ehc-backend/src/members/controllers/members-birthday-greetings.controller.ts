import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Public } from '../../auth/decorators/public.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { AuthUser } from '../../auth/types/auth-user';
import { ROLE_LEVELS } from '../../users/role-hierarchy';
import { MemberBirthdaysService } from '../services/member-birthdays.service';
import { BirthdayGreetingsService } from '../services/birthday-greetings.service';
import { CreateBirthdayGreetingDto } from '../dto/create-birthday-greeting.dto';

/**
 * Birthday wall: a public "who's celebrating soon" teaser (no auth, PII-light) plus an
 * authenticated greeting-wall CRUD, mirroring SermonsCommentsController's shape.
 *
 * Deliberately no class-level @Roles() — RolesGuard only blocks when a @Roles() requirement
 * exists (class or method); with none, @Public() routes skip auth entirely in JwtAuthGuard,
 * and authenticated routes below just need a valid session, no elevated role.
 *
 * Registered before MembersController (which owns the GET /:id catch-all).
 */
@ApiTags('members')
@Controller('members')
export class MembersBirthdayGreetingsController {
  constructor(
    private readonly birthdays: MemberBirthdaysService,
    private readonly greetings: BirthdayGreetingsService,
  ) {}

  @Public()
  @Get('birthdays/community')
  @ApiOperation({ summary: 'Community-safe upcoming birthdays — no email/DOB (public)' })
  @ApiQuery({ name: 'daysAhead', required: false })
  community(@Query('daysAhead') daysAhead?: string) {
    return this.birthdays.getCommunityBirthdays(Number(daysAhead) || 7);
  }

  @Get(':memberId/birthday-greetings')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'List greetings left for a member (any signed-in member)' })
  list(@Param('memberId') memberId: string) {
    return this.greetings.listForMember(memberId);
  }

  @Post('me/:memberId/birthday-greetings')
  @ApiBearerAuth('access-token')
  @ApiBody({ type: CreateBirthdayGreetingDto })
  @ApiOperation({ summary: 'Leave a birthday greeting for a member' })
  create(@CurrentUser() user: AuthUser, @Param('memberId') memberId: string, @Body() body: CreateBirthdayGreetingDto) {
    if (!user.memberId) return null;
    return this.greetings.create(memberId, user.memberId, body.message);
  }

  @Delete('me/birthday-greetings/:greetingId')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Delete my greeting (or any greeting, if PASTOR+)' })
  remove(@CurrentUser() user: AuthUser, @Param('greetingId') greetingId: string) {
    if (!user.memberId) return null;
    const isPastor = !!user.role && ROLE_LEVELS[user.role] >= ROLE_LEVELS[Role.PASTOR];
    return this.greetings.delete(greetingId, { memberId: user.memberId, isPastor });
  }
}
