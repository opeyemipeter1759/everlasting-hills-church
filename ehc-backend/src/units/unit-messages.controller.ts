import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/types/auth-user';
import { SendUnitMessageDto } from './dto/unit-message.dto';
import { UnitMessagesService } from './services/unit-messages.service';

@ApiTags('units')
@Controller('units')
@ApiBearerAuth('access-token')
export class UnitMessagesController {
  constructor(private readonly messages: UnitMessagesService) {}

  @Post(':unitId/messages')
  @ApiOperation({ summary: 'Message another member of the unit — delivered as a notification (any unit member to any other)' })
  @ApiBody({ type: SendUnitMessageDto })
  async send(
    @CurrentUser() actor: AuthUser,
    @Param('unitId') unitId: string,
    @Body() body: SendUnitMessageDto,
  ) {
    return this.messages.sendMessage(actor, unitId, body);
  }

  @Get(':unitId/messages')
  @ApiOperation({ summary: 'Get the conversation between the current member and another unit member' })
  async conversation(
    @CurrentUser() actor: AuthUser,
    @Param('unitId') unitId: string,
    @Query('recipientId') recipientId: string,
  ) {
    return this.messages.getConversation(actor, unitId, recipientId);
  }

  @Get(':unitId/messages/unread-counts')
  @ApiOperation({ summary: 'Get unread message counts grouped by sender' })
  async unreadCounts(@CurrentUser() actor: AuthUser, @Param('unitId') unitId: string) {
    return this.messages.getUnreadCounts(actor, unitId);
  }

  @Patch(':unitId/messages/read')
  @ApiOperation({ summary: 'Mark a conversation as read' })
  async markRead(
    @CurrentUser() actor: AuthUser,
    @Param('unitId') unitId: string,
    @Query('recipientId') recipientId: string,
  ) {
    return this.messages.markConversationRead(actor, unitId, recipientId);
  }

  @Patch(':unitId/messages/:messageId')
  @ApiOperation({ summary: 'Edit a message sent by the current member' })
  async update(
    @CurrentUser() actor: AuthUser,
    @Param('unitId') unitId: string,
    @Param('messageId') messageId: string,
    @Body('message') message: string,
  ) {
    return this.messages.updateMessage(actor, unitId, messageId, message);
  }

  @Delete(':unitId/messages/:messageId')
  @ApiOperation({ summary: 'Delete a message sent by the current member' })
  async remove(
    @CurrentUser() actor: AuthUser,
    @Param('unitId') unitId: string,
    @Param('messageId') messageId: string,
  ) {
    return this.messages.deleteMessage(actor, unitId, messageId);
  }
}
