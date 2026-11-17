import { Body, Controller, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/types/auth-user';
import { parseSchema } from '../common/zod-parse.util';
import { previewTemplateSchema } from './message-template.schema';
import { MessageTemplatesService } from './message-templates.service';
import { OpeningMessageService } from './opening-message.service';

/**
 * The message template editor: versions, saving, one-click revert and a live
 * preview. The first-timer contact and church admins only; the services check
 * the same roles again.
 */
@ApiTags('message-templates')
@Controller('message-templates')
@Roles(Role.FIRST_TIMER_CONTACT, Role.ADMIN)
@ApiBearerAuth('access-token')
export class MessageTemplatesController {
  constructor(
    private readonly templates: MessageTemplatesService,
    private readonly opening: OpeningMessageService,
  ) {}

  @Get(':key')
  @ApiOperation({ summary: 'A template: the version in use, recent versions with their editors, and the rules a save must meet' })
  history(@CurrentUser() actor: AuthUser, @Param('key') key: string) {
    return this.templates.history(actor, key);
  }

  @Post(':key')
  @ApiOperation({ summary: 'Save a new version, in use straight away. Unknown placeholders are refused with a 400 naming them' })
  save(@CurrentUser() actor: AuthUser, @Param('key') key: string, @Body() body: unknown) {
    return this.templates.save(actor, key, body);
  }

  @Post(':key/versions/:version/revert')
  @ApiOperation({ summary: 'Revert: saves an old version as the newest version' })
  revert(@CurrentUser() actor: AuthUser, @Param('key') key: string, @Param('version', ParseIntPipe) version: number) {
    return this.templates.revert(actor, key, version);
  }

  @Post(':key/preview')
  @ApiOperation({ summary: 'Fill in a draft (or the version in use) for one real first-timer, as this sender' })
  preview(@CurrentUser() actor: AuthUser, @Param('key') key: string, @Body() body: unknown) {
    this.templates.assertKey(key);
    return this.opening.preview(actor, parseSchema(previewTemplateSchema, body));
  }
}
