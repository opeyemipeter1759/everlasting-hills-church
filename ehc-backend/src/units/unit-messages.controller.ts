import { Body, Controller, Param, Post } from '@nestjs/common';
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
}
