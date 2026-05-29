import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreateTestimonialDto, UpdateTestimonialDto } from './dto/testimonial.dto';
import { TestimonialsService } from './testimonials.service';

@ApiTags('testimonials')
@Controller('testimonials')
export class TestimonialsController {
  constructor(private readonly testimonialsService: TestimonialsService) {}

  /**
   * Public endpoint — drives the homepage "My Everlasting Hills Experience" slider.
   * Returns published items only, ordered by `order` then `publishedAt`.
   */
  @Public()
  @Get('published')
  @ApiOperation({ summary: 'List published testimonials (public)' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiOkResponse({
    description: 'Array of published testimonials',
    schema: {
      example: [
        {
          id: 'uuid',
          authorName: 'Sade Adeyemi',
          authorRole: 'Member since 2018',
          authorPhotoUrl: 'https://cdn.example.com/sade.jpg',
          content: 'Everlasting Hills has been a home for me…',
          publishedAt: '2026-05-01T00:00:00.000Z',
        },
      ],
    },
  })
  async listPublished(@Query('limit') limit?: string) {
    return this.testimonialsService.listPublished(limit ? Number(limit) : 20);
  }

  // ── Admin (PASTOR+) ────────────────────────────────────────────────────────

  @Roles(Role.PASTOR)
  @Get()
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'List all testimonials including drafts (PASTOR+)' })
  async listAll() {
    return this.testimonialsService.listAll();
  }

  @Roles(Role.PASTOR)
  @Get(':id')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get testimonial by id (PASTOR+)' })
  async getById(@Param('id') id: string) {
    return this.testimonialsService.getById(id);
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

  @Roles(Role.PASTOR)
  @Delete(':id')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Delete testimonial (PASTOR+)' })
  async delete(@Param('id') id: string) {
    return this.testimonialsService.delete(id);
  }
}
