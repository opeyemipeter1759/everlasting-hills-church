import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/types/auth-user';
import { BooksService } from './books.service';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';

/**
 * The church's book library. Admin-managed (ADMIN+); the /feed and /:id read
 * routes are MEMBER+ so any signed-in member can browse and read a published
 * book, without needing admin access.
 */
@ApiTags('books')
@ApiBearerAuth('access-token')
@Controller('books')
@Roles(Role.ADMIN)
export class BooksController {
  constructor(private readonly books: BooksService) {}

  @Get()
  @ApiOperation({ summary: 'List every book, any status (ADMIN+)' })
  list() {
    return this.books.list();
  }

  @Get('feed')
  @Roles(Role.MEMBER)
  @ApiOperation({ summary: 'Published books, for members to browse (MEMBER+)' })
  feed() {
    return this.books.feed();
  }

  @Get(':id')
  @Roles(Role.MEMBER)
  @ApiOperation({ summary: 'One book — a member only sees it if PUBLISHED; ADMIN+ sees any status' })
  async getOne(@Param('id') id: string, @CurrentUser() actor: AuthUser) {
    const isAdmin = actor.effectiveRoles?.some((r) => ['ADMIN', 'ADMIN_HEAD', 'PASTOR', 'SUPER_ADMIN'].includes(r)) ?? false;
    return this.books.findOne(id, { allowDraft: isAdmin });
  }

  @Post()
  @ApiOperation({ summary: 'Add a book (ADMIN+) — upload the PDF via /uploads/document first' })
  create(@Body() body: CreateBookDto, @CurrentUser() actor: AuthUser) {
    return this.books.create(body, actor.profileId ?? undefined);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Edit a book, or publish/unpublish it (ADMIN+)' })
  update(@Param('id') id: string, @Body() body: UpdateBookDto) {
    return this.books.update(id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a book (ADMIN+)' })
  remove(@Param('id') id: string) {
    return this.books.remove(id);
  }
}
