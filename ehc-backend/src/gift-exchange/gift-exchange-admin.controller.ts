import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import type { AuthUser } from '../auth/types/auth-user';
import { GiftExchangeAdminService } from './gift-exchange-admin.service';
import { ListGiftEntriesQueryDto, RejectGiftEntryDto } from './dto/gift-exchange-admin.dto';

/** Admins (Admin, Admin Head, Pastor, Super Admin): who showed interest, and rejecting or reinstating an entry. */
@ApiTags('gift-exchange')
@ApiBearerAuth('access-token')
@Roles(Role.ADMIN)
@Controller('admin/gift-exchange')
export class GiftExchangeAdminController {
  constructor(private readonly admin: GiftExchangeAdminService) {}

  @Get('entries')
  @ApiOperation({ summary: 'Everyone who showed interest, newest first, with counts per status; optional status filter' })
  list(@Query() query: ListGiftEntriesQueryDto) {
    return this.admin.list(query.status);
  }

  @Patch('entries/:id/reject')
  @ApiOperation({ summary: "Reject a member's interest, with an optional reason" })
  reject(@CurrentUser() actor: AuthUser, @Param('id') id: string, @Body() body: RejectGiftEntryDto) {
    return this.admin.reject(actor, id, body.reason);
  }

  @Patch('entries/:id/reinstate')
  @ApiOperation({ summary: 'Put a rejected entry back to interested and clear the reason' })
  reinstate(@CurrentUser() actor: AuthUser, @Param('id') id: string) {
    return this.admin.reinstate(actor, id);
  }
}
