import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreateEventDto, UpdateEventDto } from './dto/event.dto';
import { CreateEventRsvpDto } from './dto/event-rsvp.dto';
import { EventsService } from './events.service';

/**
 * Event endpoints.
 *
 * Route ordering matters: the literal `/events/admin/*` routes are declared BEFORE
 * the public `/events/:slug` param route so NestJS matches them first.
 *
 * Admin routes use @Roles(Role.ADMIN) — hierarchical (ADMIN/PASTOR/SUPER_ADMIN pass),
 * matching the dashboard nav's Events item (minRole ADMIN).
 */
@ApiTags('events')
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  // ── Admin (ADMIN+) ──────────────────────────────────────────────────────────

  @Roles(Role.ADMIN)
  @Get('admin')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'List all events including drafts (ADMIN+)' })
  listAll() {
    return this.eventsService.listAll();
  }

  @Roles(Role.ADMIN)
  @Get('admin/:id')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get event by id (ADMIN+)' })
  getById(@Param('id') id: string) {
    return this.eventsService.getById(id);
  }

  @Roles(Role.ADMIN)
  @Get('admin/:id/rsvps')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'List RSVPs for an event (ADMIN+)' })
  listRsvps(@Param('id') id: string) {
    return this.eventsService.listRsvps(id);
  }

  @Roles(Role.ADMIN)
  @Post('admin')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create event (ADMIN+)' })
  @ApiBody({ type: CreateEventDto })
  @ApiCreatedResponse({ description: 'Event created' })
  create(@Body() body: CreateEventDto) {
    return this.eventsService.create(body);
  }

  @Roles(Role.ADMIN)
  @Patch('admin/:id')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update event (ADMIN+)' })
  @ApiBody({ type: UpdateEventDto })
  update(@Param('id') id: string, @Body() body: UpdateEventDto) {
    return this.eventsService.update(id, body);
  }

  @Roles(Role.ADMIN)
  @Delete('admin/:id')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Delete event (ADMIN+)' })
  delete(@Param('id') id: string) {
    return this.eventsService.delete(id);
  }

  // ── Public ──────────────────────────────────────────────────────────────────

  @Public()
  @Get()
  @ApiOperation({ summary: 'List published events (public)' })
  @ApiOkResponse({ description: 'Array of published event summaries' })
  listPublished() {
    return this.eventsService.listPublished();
  }

  @Public()
  @Get(':slug')
  @ApiOperation({ summary: 'Get a published event by slug (public)' })
  getBySlug(@Param('slug') slug: string) {
    return this.eventsService.getBySlug(slug);
  }

  @Public()
  @Post(':slug/rsvp')
  @ApiOperation({ summary: 'RSVP to an event (public)' })
  @ApiBody({ type: CreateEventRsvpDto })
  @ApiCreatedResponse({ description: 'RSVP received' })
  rsvp(@Param('slug') slug: string, @Body() body: CreateEventRsvpDto) {
    return this.eventsService.createRsvp(slug, body);
  }
}
