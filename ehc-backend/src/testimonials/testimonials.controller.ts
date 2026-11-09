import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiCreatedResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import type { AuthUser } from '../auth/types/auth-user';
import { CreateTestimonialDto, MarkTestimonialReadDto, UpdateTestimonialDto } from './dto/testimonial.dto';
import { TestimonialsService } from './testimonials.service';

@ApiTags('testimonials')
@Controller('testimonials')
export class TestimonialsController {
  constructor(private readonly testimonialsService: TestimonialsService) {}

  // ── Admin (ADMIN+ can view/moderate/delete; PASTOR+ can also create/edit) ───

  @Roles(Role.ADMIN)
  @Get()
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'List all testimonials including drafts (ADMIN+)' })
  async listAll() {
    return this.testimonialsService.listAll();
  }

  @Roles(Role.PASTOR)
  @Post()
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create testimonial (PASTOR+)' })
  @ApiBody({ type: CreateTestimonialDto })
  @ApiCreatedResponse({ description: 'Testimonial created' })
  async create(@Body() body: CreateTestimonialDto) {
    return this.testimonialsService.create(body);
  }

  @Roles(Role.PASTOR)
  @Patch(':id')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update testimonial (PASTOR+)' })
  @ApiBody({ type: UpdateTestimonialDto })
  async update(@Param('id') id: string, @Body() body: UpdateTestimonialDto) {
    return this.testimonialsService.update(id, body);
  }

  @Roles(Role.ADMIN)
  @Patch(':id/read')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Mark testimonial read or unread (ADMIN+)' })
  @ApiBody({ type: MarkTestimonialReadDto })
  async markRead(@Param('id') id: string, @Body() body: MarkTestimonialReadDto, @CurrentUser() user: AuthUser) {
    return this.testimonialsService.markRead(id, body.read, user.profileId);
  }

  @Roles(Role.ADMIN)
  @Delete(':id')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Delete testimonial (ADMIN+)' })
  async delete(@Param('id') id: string) {
    return this.testimonialsService.delete(id);
  }
}
