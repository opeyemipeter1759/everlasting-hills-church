import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../auth/decorators/public.decorator';
import { ContactDto } from './dto/contact.dto';
import { FirstTimerDto } from './dto/first-timer.dto';
import { PrayerRequestDto } from './dto/prayer-request.dto';
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
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('prayer-request')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Submit Prayer Request',
    description: 'Create a prayer request record and notify the church team by email.',
  })
  @ApiCreatedResponse({ description: 'Prayer request submitted successfully' })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  async prayerRequest(@Body() body: PrayerRequestDto) {
    return this.formsService.submitPrayerRequest(body);
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
