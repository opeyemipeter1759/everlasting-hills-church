import { BadRequestException, Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import type { AuthUser } from '../../auth/types/auth-user';
import { ProfileCommentDto, SpouseRequestDto } from '../dto/spouse.dto';
import { MemberActivityService } from '../services/member-activity.service';
import { ProfileSocialService } from '../services/profile-social.service';
import { MemberFamilyService } from '../services/member-family.service';
import { MemberSpouseService } from '../services/member-spouse.service';

/**
 * The church family, open to every signed-in member: finding each other,
 * opening each other's profiles, and linking a spouse with their agreement.
 *
 * Registered before MembersController, whose GET /:id would otherwise take
 * /members/family.
 */
@ApiTags('members')
@ApiBearerAuth('access-token')
@Controller('members')
@Roles(Role.MEMBER)
export class MembersFamilyController {
  constructor(
    private readonly family: MemberFamilyService,
    private readonly spouse: MemberSpouseService,
    private readonly activity: MemberActivityService,
    private readonly social: ProfileSocialService,
  ) {}

  private viewer(actor: AuthUser): string {
    if (!actor.memberId) throw new BadRequestException('Your account has no member profile yet.');
    return actor.memberId;
  }

  @Get('family')
  @ApiOperation({ summary: 'Active members by name, a page at a time, for the church family directory (MEMBER+)' })
  @ApiQuery({ name: 'q', required: false })
  @ApiQuery({ name: 'page', required: false })
  directory(@Query('q') q?: string, @Query('page') page?: string) {
    return this.family.directory(q, Number(page) || 1);
  }

  @Get('me/spouse')
  @ApiOperation({ summary: 'My marital status, spouse, and spouse requests waiting on me or them' })
  mySpouse(@CurrentUser() actor: AuthUser) {
    return this.spouse.mine(actor.userId, actor.email);
  }

  @Post('me/spouse-requests')
  @ApiOperation({ summary: 'Ask a member to confirm they are my spouse' })
  @ApiBody({ type: SpouseRequestDto })
  requestSpouse(@CurrentUser() actor: AuthUser, @Body() body: SpouseRequestDto) {
    return this.spouse.request(actor.userId, body.memberId, actor.email);
  }

  @Delete('me/spouse-requests')
  @ApiOperation({ summary: 'Withdraw the spouse request I sent' })
  cancelSpouseRequest(@CurrentUser() actor: AuthUser) {
    return this.spouse.cancel(actor.userId, actor.email);
  }

  @Post('me/spouse-requests/:id/accept')
  @ApiOperation({ summary: 'Confirm I am married to the member who asked' })
  acceptSpouse(@CurrentUser() actor: AuthUser, @Param('id') id: string) {
    return this.spouse.respond(actor.userId, id, true, actor.email);
  }

  @Post('me/spouse-requests/:id/decline')
  @ApiOperation({ summary: 'Decline a spouse request' })
  declineSpouse(@CurrentUser() actor: AuthUser, @Param('id') id: string) {
    return this.spouse.respond(actor.userId, id, false, actor.email);
  }

  @Delete('me/spouse')
  @ApiOperation({ summary: 'Remove my spouse link, for both of us' })
  unlinkSpouse(@CurrentUser() actor: AuthUser) {
    return this.spouse.unlink(actor.userId, actor.email);
  }

  @Get(':id/profile')
  @ApiOperation({
    summary: "A member's profile as the church family sees it, with their figures, badges, articles and likes: no phone, email or address (MEMBER+)",
  })
  async profile(@Param('id') id: string, @CurrentUser() actor: AuthUser) {
    const profile = await this.family.profile(id);
    const [activity, social] = await Promise.all([
      this.activity.activity(id),
      this.social.summary(id, actor.memberId ?? null),
    ]);
    return { ...profile, ...activity, ...social, isMe: actor.memberId === id };
  }

  @Post(':id/like')
  @ApiOperation({ summary: "Like a member's profile" })
  like(@Param('id') id: string, @CurrentUser() actor: AuthUser) {
    return this.social.like(id, this.viewer(actor));
  }

  @Delete(':id/like')
  @ApiOperation({ summary: "Take back a like on a member's profile" })
  unlike(@Param('id') id: string, @CurrentUser() actor: AuthUser) {
    return this.social.unlike(id, this.viewer(actor));
  }

  @Get(':id/comments')
  @ApiOperation({ summary: "Kind words written on a member's profile, newest first" })
  @ApiQuery({ name: 'page', required: false })
  comments(@Param('id') id: string, @Query('page') page?: string) {
    return this.social.comments(id, Number(page) || 1);
  }

  @Post(':id/comments')
  @ApiOperation({ summary: "Write something nice about a member, on their profile" })
  @ApiBody({ type: ProfileCommentDto })
  comment(@Param('id') id: string, @Body() body: ProfileCommentDto, @CurrentUser() actor: AuthUser) {
    return this.social.comment(id, this.viewer(actor), body.body);
  }

  @Delete(':id/comments/:commentId')
  @ApiOperation({ summary: 'Remove a comment: its writer, the profile owner, or a pastor or admin' })
  deleteComment(@Param('id') id: string, @Param('commentId') commentId: string, @CurrentUser() actor: AuthUser) {
    const staff = (actor.effectiveRoles ?? []).some((r) => (['PASTOR', 'ADMIN', 'ADMIN_HEAD', 'SUPER_ADMIN'] as string[]).includes(r));
    return this.social.deleteComment(id, commentId, actor.memberId ?? null, staff);
  }
}
