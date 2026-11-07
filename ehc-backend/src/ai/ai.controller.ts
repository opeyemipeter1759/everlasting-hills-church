import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Type } from 'class-transformer';
import { IsIn, IsNotEmpty, IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';
import { WRITING_ACTIONS, WRITING_TEXT_MAX, type WritingAction } from './writing-assist';
import { Role } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { AiService } from './ai.service';

class GenerateDto {
  @IsString() @IsNotEmpty() @MaxLength(100_000) prompt!: string;
}

class WritingContextDto {
  @IsOptional() @IsString() @MaxLength(200) title?: string;
  @IsOptional() @IsString() @MaxLength(250) subtitle?: string;
}

class WritingAssistDto {
  @IsIn(WRITING_ACTIONS) action!: WritingAction;
  @IsString() @IsNotEmpty() @MaxLength(WRITING_TEXT_MAX) text!: string;
  @IsOptional() @ValidateNested() @Type(() => WritingContextDto) context?: WritingContextDto;
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

  // The article editor's writing helpers. Open to every member, which is safe
  // because the instructions are fixed here: a member picks an action and
  // sends their own text, never a prompt. Tighter limit than the admin route,
  // counted per account by the global throttler.
  @Roles(Role.MEMBER)
  @Throttle({ default: { limit: 12, ttl: 60_000 } })
  @Post('writing-assist')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Fix, improve, rephrase, shorten, expand or simplify article text, or suggest titles (member)' })
  writingAssist(@Body() dto: WritingAssistDto) {
    return this.ai.writingAssist(dto.action, dto.text, dto.context);
  }
}
