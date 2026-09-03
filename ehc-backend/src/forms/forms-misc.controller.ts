import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiBadRequestResponse, ApiCreatedResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import type { AuthUser } from '../auth/types/auth-user';
import { ContactDto } from './dto/contact.dto';
import { HomeCellDto } from './dto/home-cell.dto';
import { ServeTeamDto } from './dto/serve-team.dto';
import { TestimonyDto } from './dto/testimony.dto';
import { TestimonyFormService } from './services/testimony-form.service';
import { ServeTeamFormService } from './services/serve-team-form.service';
import { ContactFormService } from './services/contact-form.service';
import { HomeCellFormService } from './services/home-cell-form.service';

/** Remaining public intake forms: testimony, serve-team interest, contact, home-cell. */
@ApiTags('forms')
@Controller('forms')
export class FormsMiscController {
  constructor(
    private readonly testimonySvc: TestimonyFormService,
    private readonly serveTeamSvc: ServeTeamFormService,
    private readonly contactSvc: ContactFormService,
    private readonly homeCellSvc: HomeCellFormService,
  ) {}

  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('testimony')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Submit Testimony',
    description:
      'Save a testimony submission and notify the church team by email. Public — works with no session. ' +
      'If the submitter is signed in, their member is linked on the record even when marked anonymous (same ' +
      'optional-auth semantics as prayer-request/question).',
  })
  @ApiCreatedResponse({ description: 'Testimony submitted successfully' })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  async testimony(@Body() body: TestimonyDto, @CurrentUser() user?: AuthUser) {
    return this.testimonySvc.submitTestimony(body, user?.memberId ?? null);
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
    return this.serveTeamSvc.submitServeTeam(body);
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
    return this.contactSvc.submitContact(body);
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('home-cell')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Register for a Home Cell',
    description: 'Submit Home Cell registration and notify the team by email.',
  })
  @ApiCreatedResponse({ description: 'Home Cell registration submitted' })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  async homeCell(@Body() body: HomeCellDto) {
    return this.homeCellSvc.submitHomeCell(body);
  }
}
