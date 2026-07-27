import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { IsEmail, IsNotEmpty, MaxLength } from 'class-validator';
import { Role } from '@prisma/client';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { OnlineAttendanceService } from './online-attendance.service';

class CheckInDto {
  @IsEmail() @IsNotEmpty() @MaxLength(254) email!: string;
}

@ApiTags('online-attendance')
@Controller('online-attendance')
export class OnlineAttendanceController {
  constructor(private readonly svc: OnlineAttendanceService) {}

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60 } })
  @Post('check-in')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Record an online attendance check-in (YouTube or Telegram)' })
  checkIn(@Body() dto: CheckInDto) {
    return this.svc.checkIn(dto.email);
  }

  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.PASTOR)
  @Get()
  @ApiOperation({ summary: 'List online check-in records (admin)' })
  list(
    @Query('channel') channel?: string,
    @Query('stage') stage?: string,
    @Query('take') take?: string,
    @Query('skip') skip?: string,
  ) {
    return this.svc.list({
      channel: channel?.toUpperCase(),
      stage: stage?.toUpperCase(),
      take: take ? parseInt(take, 10) : 50,
      skip: skip ? parseInt(skip, 10) : 0,
    });
  }
}
