import { Body, Controller, Post } from '@nestjs/common';
import {
  ApiTags,
  ApiBody,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiOperation,
  ApiInternalServerErrorResponse,
  ApiConflictResponse,
} from '@nestjs/swagger';
import { FirstTimerDto, PrayerRequestDto, TestimonyDto } from '../dto';
import { FormsService } from './forms.service';

@ApiTags('forms')
@Controller('forms')
export class FormsController {
  constructor(private readonly formsService: FormsService) {}

  @Post('register')
  @ApiOperation({
    summary: 'Register First Timer',
    description: 'Submit first timer registration form with visitor information. Creates both a Visitor record and form submission entry.',
  })
  @ApiBody({
    type: FirstTimerDto,
    description: 'First timer visitor information',
    examples: {
      example1: {
        value: {
          first_name: 'Freya',
          last_name: 'Hall',
          phone_number: '+1 (644) 543-9874',
          email: 'jimeqaquh@mailinator.com',
          gender: 'Female',
          attendance_type: 'Online',
          how_did_you_learn: 'Social Media',
          invited_by: '',
          located_in_ibadan: false,
          membership_interest: 'Maybe',
          address: 'Dignissimos et eos u',
          occupation: 'Eos aspernatur quam',
          born_again: 'No',
          service_experience: 'In placeat nostrum',
          prayer_point: 'Mollitia esse invent',
          whatsapp_interest: false,
          birth_day: '27',
          birth_month: 'June',
          type: 'FIRST_TIMER',
        },
      },
    },
  })
  @ApiCreatedResponse({
    description: 'First timer registration submitted successfully',
    schema: {
      example: {
        success: true,
        message: 'First timer registration submitted successfully',
        visitor: {
          id: 'visitor-123',
          tenantId: 'tenant-001',
          firstName: 'Freya',
          lastName: 'Hall',
          email: 'jimeqaquh@mailinator.com',
          phone: '+1 (644) 543-9874',
          gender: 'Female',
          attendanceType: 'Online',
          howDidYouLearn: 'Social Media',
          membershipInterest: 'Maybe',
          address: 'Dignissimos et eos u',
          submittedAt: '2026-05-25T10:30:00Z',
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid request data or missing required fields',
    schema: {
      example: {
        statusCode: 400,
        message: 'Validation failed',
        error: ['first_name is required', 'last_name is required'],
      },
    },
  })
  @ApiConflictResponse({
    description: 'Email or phone number already exists in the database',
    schema: {
      example: {
        statusCode: 409,
        message: 'A visitor with email "jimeqaquh@mailinator.com" already exists',
        error: 'Conflict',
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description: 'Server error during form submission',
    schema: {
      example: {
        statusCode: 500,
        message: 'An error occurred while processing the registration',
        error: 'Internal Server Error',
      },
    },
  })
  async register(@Body() body: FirstTimerDto) {
    return this.formsService.submitFirstTimer(body);
  }

  @Post('prayer-request')
  @ApiOperation({
    summary: 'Submit Prayer Request',
    description: 'Create a prayer request record and notify the church team by email.',
  })
  @ApiBody({
    type: PrayerRequestDto,
    examples: {
      example1: {
        value: {
          request: 'Please pray for my family and my job.',
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+1 (555) 123-4567',
          is_anonymous: false,
        },
      },
    },
  })
  @ApiCreatedResponse({
    description: 'Prayer request submitted successfully',
    schema: {
      example: {
        success: true,
        message: 'Prayer request submitted successfully',
        data: {
        id: 'prayer-request-123',
        tenantId: 'tenant-001',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1 (555) 123-4567',
        request: 'Please pray for my family and my job.',
        isAnonymous: false,
        submittedAt: '2026-05-25T10:30:00Z',
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid request data or missing required fields',
    schema: {
      example: {
        statusCode: 400,
        message: 'Request text is required',
        error: 'Bad Request',
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description: 'Server error during prayer request submission',
    schema: {
      example: {
        statusCode: 500,
        message: 'An error occurred while processing the prayer request',
        error: 'Internal Server Error',
      },
    },
  })
  async prayerRequest(@Body() body: PrayerRequestDto) {
    return this.formsService.submitPrayerRequest(body);
  }

  @Post('testimony')
  @ApiOperation({
    summary: 'Submit Testimony',
    description: 'Save a testimony submission and notify the church team by email.',
  })
  @ApiBody({
    type: TestimonyDto,
    examples: {
      example1: {
        value: {
          title: 'God answered my prayer',
          testimony: 'God healed me after the Sunday service.',
          name: 'Jane Doe',
          email: 'jane@example.com',
          phone: '+1 (555) 987-6543',
        },
      },
    },
  })
  @ApiCreatedResponse({
    description: 'Testimony submitted successfully',
    schema: {
      example: {
        success: true,
        message: 'Testimony submitted successfully',
        data: {
        id: 'submission-123',
        tenantId: 'tenant-001',
        type: 'testimony',
        data: {
          title: 'God answered my prayer',
          testimony: 'God healed me after the Sunday service.',
          name: 'Jane Doe',
          email: 'jane@example.com',
        },
        submittedAt: '2026-05-25T10:30:00Z',
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid request data or missing required fields',
    schema: {
      example: {
        statusCode: 400,
        message: 'Testimony content is required',
        error: 'Bad Request',
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description: 'Server error during testimony submission',
    schema: {
      example: {
        statusCode: 500,
        message: 'An error occurred while processing the testimony',
        error: 'Internal Server Error',
      },
    },
  })
  async testimony(@Body() body: TestimonyDto) {
    return this.formsService.submitTestimony(body);
  }
}
