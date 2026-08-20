import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/types/auth-user';
import { EmailsService } from './emails.service';
import { CreateEmailTemplateDto } from './dto/create-email-template.dto';
import { UpdateEmailTemplateDto } from './dto/update-email-template.dto';
import { SendEmailDto } from './dto/send-email.dto';
import { AudienceFilterDto } from './dto/audience-filter.dto';

/**
 * Admin "Emails" feature — reusable templates + targeted sends (all members, a
 * unit, an effective role, or hand-picked people). ADMIN+ only.
 */
@ApiTags('emails')
@ApiBearerAuth('access-token')
@Controller('emails')
@Roles(Role.ADMIN)
export class EmailsController {
  constructor(private readonly emails: EmailsService) {}

  @Post('templates')
  @ApiOperation({ summary: 'Save a reusable email template' })
  createTemplate(@Body() body: CreateEmailTemplateDto, @CurrentUser() user: AuthUser) {
    return this.emails.createTemplate(body, user.profileId);
  }

  @Get('templates')
  @ApiOperation({ summary: 'List saved email templates' })
  listTemplates() {
    return this.emails.listTemplates();
  }

  @Get('templates/:id')
  @ApiOperation({ summary: 'Get one email template' })
  getTemplate(@Param('id') id: string) {
    return this.emails.getTemplate(id);
  }

  @Patch('templates/:id')
  @ApiOperation({ summary: 'Edit a template' })
  updateTemplate(@Param('id') id: string, @Body() body: UpdateEmailTemplateDto) {
    return this.emails.updateTemplate(id, body);
  }

  @Delete('templates/:id')
  @ApiOperation({ summary: 'Delete a template' })
  removeTemplate(@Param('id') id: string) {
    return this.emails.removeTemplate(id);
  }

  @Post('recipients/preview')
  @ApiOperation({ summary: 'Resolve an audience filter into a recipient count + short sample, before sending' })
  previewRecipients(@Body() body: AudienceFilterDto) {
    return this.emails.previewRecipients(body);
  }

  @Post('send')
  @ApiOperation({ summary: 'Send an email to a resolved audience and log the send' })
  send(@Body() body: SendEmailDto, @CurrentUser() user: AuthUser) {
    return this.emails.send(body, user.profileId);
  }

  @Get('sent')
  @ApiOperation({ summary: 'List past sends (audit/history), paginated' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  listSent(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.emails.listSent(page, limit);
  }
}
