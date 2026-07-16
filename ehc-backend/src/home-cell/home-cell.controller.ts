import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { Role } from '@prisma/client';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { HomeCellService } from './home-cell.service';

class CreateCellDto {
  @IsString() @IsNotEmpty() @MaxLength(120) name!: string;
  @IsOptional() @IsString() @MaxLength(120) leaderName?: string;
  @IsString() @IsNotEmpty() @MaxLength(40)  leaderPhone!: string;
  @IsString() @IsNotEmpty() @MaxLength(40)  meetingDay!: string;
  @IsString() @IsNotEmpty() @MaxLength(40)  meetingTime!: string;
  @IsString() @IsNotEmpty() @MaxLength(300) address!: string;
  @IsOptional() @IsString() @MaxLength(80)  city?: string;
  @IsOptional() @IsString() @MaxLength(80)  state?: string;
}

class JoinDto {
  @IsString() @IsNotEmpty() @MaxLength(120) name!: string;
  @IsString() @IsNotEmpty() @MaxLength(40)  phone!: string;
  @IsOptional() @IsEmail() @MaxLength(254)  email?: string;
  @IsOptional() @IsString() @MaxLength(80)  preferredTime?: string;
  @IsOptional() @IsString() @MaxLength(500) prayerRequest?: string;
}

@ApiTags('home-cell')
@Controller('home-cell')
export class HomeCellController {
  constructor(private readonly svc: HomeCellService) {}

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add a new Home Cell' })
  create(@Body() body: CreateCellDto) {
    return this.svc.create(body);
  }

  // ── Admin endpoints ────────────────────────────────────────────────────────

  @Roles(Role.ADMIN)
  @Get('admin/all')
  @ApiOperation({ summary: 'List all cells including pending (ADMIN+)' })
  adminAll() { return this.svc.findAllAdmin(); }

  @Roles(Role.ADMIN)
  @Post('admin')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Admin creates a cell — immediately active (ADMIN+)' })
  adminCreate(@Body() body: CreateCellDto) { return this.svc.createByAdmin(body); }

  @Roles(Role.ADMIN)
  @Patch(':id/approve')
  @ApiOperation({ summary: 'Approve a pending cell (ADMIN+)' })
  approve(@Param('id') id: string) { return this.svc.approve(id); }

  @Roles(Role.ADMIN)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete / reject a cell (ADMIN+)' })
  remove(@Param('id') id: string) { return this.svc.remove(id); }

  // ── Public endpoints ───────────────────────────────────────────────────────

  @Public()
  @Get('states')
  @ApiOperation({ summary: 'Distinct states that have active cells' })
  states() { return this.svc.getStates(); }

  @Public()
  @Get('cities')
  @ApiOperation({ summary: 'Distinct cities for a given state' })
  cities(@Query('state') state: string) { return this.svc.getCities(state); }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Search active cells by state and/or city' })
  search(@Query('state') state?: string, @Query('city') city?: string) {
    return this.svc.search(state, city);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get a single cell by id' })
  findOne(@Param('id') id: string) { return this.svc.findOne(id); }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post(':id/join')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Request to join a Home Cell' })
  join(@Param('id') id: string, @Body() body: JoinDto) {
    return this.svc.join(id, body);
  }
}
