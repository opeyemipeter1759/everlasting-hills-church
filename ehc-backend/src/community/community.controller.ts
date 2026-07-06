import { Body, Controller, ForbiddenException, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { IsString, MaxLength, MinLength } from 'class-validator';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/types/auth-user';
import { CommunityService } from './community.service';

class CreatePostDto {
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  text!: string;
}

@ApiTags('community')
@ApiBearerAuth('access-token')
@Controller('community')
@Roles(Role.MEMBER)
export class CommunityController {
  constructor(private readonly community: CommunityService) {}

  @Get('feed')
  @ApiOperation({ summary: 'Latest 20 community posts' })
  feed() {
    return this.community.getFeed();
  }

  @Post('posts')
  @ApiOperation({ summary: 'Submit a new community post' })
  createPost(@Body() body: CreatePostDto, @CurrentUser() user: AuthUser) {
    if (!user.profileId) throw new ForbiddenException('No profile linked to your account');
    return this.community.createPost(user.profileId, body.text);
  }

  @Post('posts/:id/react')
  @ApiOperation({ summary: 'Add a heart reaction to a post' })
  react(@Param('id') id: string) {
    return this.community.react(id);
  }
}
