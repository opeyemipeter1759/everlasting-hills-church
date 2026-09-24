import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { Role } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { AiService } from './ai.service';

class GenerateDto {
  @IsString() @IsNotEmpty() @MaxLength(100_000) prompt!: string;
}

@ApiTags('ai')
@ApiBearerAuth('access-token')
@Controller('ai')
export class AiController {
  constructor(private readonly ai: AiService) {}

  // Every AI helper on the website sits on an ADMIN-or-above page, so this
  // costs nothing to legitimate users and keeps the Gemini quota off-limits
  // to everyone else.
  @Roles(Role.ADMIN)
  @Throttle({ default: { limit: 30, ttl: 60 } })
  @Post('generate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Run a Gemini prompt for the website AI helpers (admin)' })
  generate(@Body() dto: GenerateDto) {
    return this.ai.generate(dto.prompt);
  }
}
