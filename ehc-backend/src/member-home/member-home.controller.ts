import { Controller, Get, Header } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import type { AuthUser } from '../auth/types/auth-user';
import { MemberHomeService } from './member-home.service';

@ApiTags('member-home')
@ApiBearerAuth('access-token')
@Controller('member-home')
export class MemberHomeController {
  constructor(private readonly home: MemberHomeService) {}

  @Get()
  @Roles(Role.MEMBER)
  @Header('Cache-Control', 'no-store')
  @ApiOperation({ summary: "Everything on the member dashboard's home page, in one request" })
  load(@CurrentUser() actor: AuthUser) {
    return this.home.load(actor);
  }
}
