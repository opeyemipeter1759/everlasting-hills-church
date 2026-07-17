import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Role } from '@prisma/client';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import type { AuthUser } from '../auth/types/auth-user';
import { ContactDto } from './dto/contact.dto';
import { FirstTimerDto } from './dto/first-timer.dto';
import { PrayerRequestDto } from './dto/prayer-request.dto';
import { ServeTeamDto } from './dto/serve-team.dto';
import { TestimonyDto } from './dto/testimony.dto';
import { FormsService } from './forms.service';

/**
 * Public-facing intake forms. All endpoints are @Public — they are submitted by
 * unauthenticated visitors. Each is throttled tightly to slow spam/abuse.
 */
@ApiTags('forms')
@Controller('forms')
export class FormsController {
  constructor(private readonly formsService: FormsService) {}

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Register First Timer',
    description: 'Submit first timer registration. Creates a Visitor and FormSubmission and notifies the team.',
  })
  @ApiCreatedResponse({ description: 'First timer registration submitted successfully' })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  @ApiConflictResponse({ description: 'Email or phone already registered' })
  @ApiInternalServerErrorResponse({ description: 'Server error during form submission' })
  async register(@Body() body: FirstTimerDto) {
    return this.formsService.submitFirstTimer(body);
  }

  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('prayer-request')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Submit Prayer Request',
    description:
      'Create a prayer request record and notify the church team by email. Public — works with no session. ' +
      'If the submitter is signed in, their member is linked on the record even when marked anonymous (anonymous ' +
      'only hides the name shown around the request; admins can always see who a signed-in submitter really is).',
  })
  @ApiCreatedResponse({ description: 'Prayer request submitted successfully' })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  async prayerRequest(@Body() body: PrayerRequestDto, @CurrentUser() user?: AuthUser) {
    return this.formsService.submitPrayerRequest(body, user?.memberId ?? null);
  }

  @Get('prayer-requests')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'List all prayer requests, newest first (ADMIN+)' })
  async listPrayerRequests() {
    return this.formsService.listPrayerRequests();
  }

  @Delete('prayer-requests/:id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete a prayer request (ADMIN+)' })
  async deletePrayerRequest(@Param('id') id: string) {
    return this.formsService.deletePrayerRequest(id);
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('testimony')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Submit Testimony',
    description: 'Save a testimony submission and notify the church team by email.',
  })
  @ApiCreatedResponse({ description: 'Testimony submitted successfully' })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  async testimony(@Body() body: TestimonyDto) {
    return this.formsService.submitTestimony(body);
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('serve-team')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Submit Serve Team Interest',
    description: 'Record interest in joining a service unit and notify the team by email.',
  })
  @ApiCreatedResponse({ description: 'Serve team interest submitted' })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  async serveTeam(@Body() body: ServeTeamDto) {
    return this.formsService.submitServeTeam(body);
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('contact')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Submit Contact Message',
    description: 'Store a contact message and notify the church team by email.',
  })
  @ApiCreatedResponse({ description: 'Contact message submitted' })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  async contact(@Body() body: ContactDto) {
    return this.formsService.submitContact(body);
  }
}
