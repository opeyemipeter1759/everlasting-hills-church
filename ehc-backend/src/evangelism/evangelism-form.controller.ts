import { Body, Controller, Get, HttpCode, HttpStatus, Logger, NotFoundException, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../auth/decorators/public.decorator';
import { PublicEvangelismContactDto } from './dto/evangelism.dto';
import { EvangelismAccessService } from './services/evangelism-access.service';
import { EvangelismContactsService } from './services/evangelism-contacts.service';
import { EvangelismOutreachesService } from './services/evangelism-outreaches.service';

/**
 * The outreach form: opened on a phone at the roadside, no sign-in. It shows
 * the team's names and the open outreaches, and takes a contact in — it never
 * gives any contact's details back.
 */
@ApiTags('evangelism')
@Controller('evangelism/form')
export class EvangelismFormController {
  private readonly logger = new Logger(EvangelismFormController.name);

  constructor(
    private readonly access: EvangelismAccessService,
    private readonly contacts: EvangelismContactsService,
    private readonly outreaches: EvangelismOutreachesService,
  ) {}

  @Public()
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @Get('options')
  @ApiOperation({ summary: 'Workers and active outreaches for the public evangelism form' })
  async options() {
    const unit = await this.access.findUnit();
    if (!unit) return { workers: [], outreaches: [] };
    const [team, outreaches] = await Promise.all([this.access.team(unit.id), this.outreaches.activeForForm()]);
    return { workers: team.map((m) => ({ id: m.id, name: m.name })), outreaches };
  }

  @Public()
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Record someone preached to, from the public evangelism form' })
  @ApiCreatedResponse({ description: 'Recorded' })
  async submit(@Body() body: PublicEvangelismContactDto) {
    const { website, ...contact } = body;
    // Bots fill in every field; people never see this one. Look successful, keep nothing.
    if (website) {
      this.logger.warn({ msg: 'evangelism form honeypot tripped' });
      return { ok: true };
    }
    const unit = await this.access.findUnit();
    if (!unit) throw new NotFoundException('The Evangelism form is not set up yet.');
    await this.contacts.create(unit.id, contact, { memberId: null, name: 'Outreach form' }, 'FORM');
    return { ok: true };
  }
}
