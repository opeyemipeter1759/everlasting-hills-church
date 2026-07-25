import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBadRequestResponse, ApiConflictResponse, ApiCreatedResponse, ApiInternalServerErrorResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Role } from '@prisma/client';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import type { AuthUser } from '../auth/types/auth-user';
import { FirstTimerDto } from './dto/first-timer.dto';
import { PrayerRequestDto, UpdatePrayerRequestStatusDto } from './dto/prayer-request.dto';
import { QuestionDto, UpdateQuestionStatusDto } from './dto/question.dto';
import { FirstTimerFormService } from './services/first-timer-form.service';
import { PrayerRequestFormService } from './services/prayer-request-form.service';
import { QuestionFormService } from './services/question-form.service';

/**
 * Public-facing intake forms: first-timer registration, prayer requests, questions.
 * All submit endpoints are @Public — submitted by unauthenticated visitors and
 * throttled tightly to slow spam/abuse. See forms-misc.controller.ts for the
 * remaining form types (testimony/serve-team/contact/home-cell).
 */
@ApiTags('forms')
@Controller('forms')
export class FormsController {
  constructor(
    private readonly firstTimer: FirstTimerFormService,
    private readonly prayerRequestSvc: PrayerRequestFormService,
    private readonly questionSvc: QuestionFormService,
  ) {}

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
    return this.firstTimer.submitFirstTimer(body);
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
    return this.prayerRequestSvc.submitPrayerRequest(body, user?.memberId ?? null);
  }

  @Get('prayer-requests')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'List all prayer requests, newest first (ADMIN+)' })
  async listPrayerRequests() {
    return this.prayerRequestSvc.listPrayerRequests();
  }

  @Delete('prayer-requests/:id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete a prayer request (ADMIN+)' })
  async deletePrayerRequest(@Param('id') id: string) {
    return this.prayerRequestSvc.deletePrayerRequest(id);
  }

  @Patch('prayer-requests/:id/status')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Mark a prayer request prayed-for/pending (ADMIN+)' })
  async updatePrayerRequestStatus(@Param('id') id: string, @Body() body: UpdatePrayerRequestStatusDto) {
    return this.prayerRequestSvc.updatePrayerRequestStatus(id, body.status);
  }

  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('question')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Submit a Question',
    description:
      'Create a question record and notify the church team by email. Public — works with no session. ' +
      'Same optional-auth semantics as prayer-request: signed-in submitters are always linked, even when anonymous.',
  })
  @ApiCreatedResponse({ description: 'Question submitted successfully' })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  async question(@Body() body: QuestionDto, @CurrentUser() user?: AuthUser) {
    return this.questionSvc.submitQuestion(body, user?.memberId ?? null);
  }

  @Get('questions')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'List all questions, newest first (ADMIN+)' })
  async listQuestions() {
    return this.questionSvc.listQuestions();
  }

  @Delete('questions/:id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete a question (ADMIN+)' })
  async deleteQuestion(@Param('id') id: string) {
    return this.questionSvc.deleteQuestion(id);
  }

  @Patch('questions/:id/status')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Mark a question answered/pending (ADMIN+)' })
  async updateQuestionStatus(@Param('id') id: string, @Body() body: UpdateQuestionStatusDto) {
    return this.questionSvc.updateQuestionStatus(id, body.status);
  }
}
