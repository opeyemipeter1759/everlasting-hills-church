import { Body, Controller, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { AuthUser } from '../../auth/types/auth-user';
import { ConvertVisitorDto } from '../../classes/dto/classes.dto';
import { BulkImportDto } from '../dto/bulk-import.dto';
import { MemberOnboardingService } from '../services/member-onboarding.service';
import { MemberBulkImportService } from '../services/member-bulk-import.service';

/** Bringing new people into the membership: single visitor conversion + CSV bulk import. */
@ApiTags('members')
@Controller('members')
@Roles(Role.ADMIN)
@ApiBearerAuth('access-token')
export class MembersOnboardingController {
  constructor(
    private readonly onboarding: MemberOnboardingService,
    private readonly bulkImportSvc: MemberBulkImportService,
  ) {}

  @Post('convert-visitor/:visitorId')
  @ApiOperation({ summary: 'Convert a visitor to a member' })
  @ApiOkResponse({
    description: 'Created member object',
    schema: {
      example: {
        id: 'd290f1ee-6c54-4b01-90e6-d701748f0851',
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane.doe@example.com',
        joinedAt: '2026-05-26T12:00:00.000Z',
        status: 'ACTIVE',
      },
    },
  })
  async convertVisitor(
    @Param('visitorId') visitorId: string,
    @CurrentUser() actor: AuthUser,
    @Body() body: ConvertVisitorDto = {},
  ) {
    return this.onboarding.convertVisitorToMember(visitorId, {
      creditedSundays: body?.creditedSundays,
      actorProfileId: actor?.profileId ?? null,
    });
  }

  @Post('import')
  @ApiOperation({ summary: 'Bulk-import members from CSV rows' })
  async bulkImport(@Body() body: BulkImportDto) {
    return this.bulkImportSvc.bulkImport(body.rows, body.sendWelcome ?? false);
  }
}
