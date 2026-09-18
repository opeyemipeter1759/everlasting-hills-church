import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { BookCollectionsService } from './book-collections.service';
import { CreateBookCollectionDto } from './dto/create-book-collection.dto';
import { UpdateBookCollectionDto } from './dto/update-book-collection.dto';

/**
 * The shelves a book library is grouped into. Admin-managed; /feed is
 * MEMBER+ so the library page can render section headers in order.
 */
@ApiTags('book-collections')
@ApiBearerAuth('access-token')
@Controller('book-collections')
@Roles(Role.ADMIN)
export class BookCollectionsController {
  constructor(private readonly collections: BookCollectionsService) {}

  @Get()
  @ApiOperation({ summary: 'List every collection with its book count (ADMIN+)' })
  list() {
    return this.collections.list();
  }

  @Get('feed')
  @Roles(Role.MEMBER)
  @ApiOperation({ summary: 'Collections with at least one published book, in shelf order (MEMBER+)' })
  feed() {
    return this.collections.feed();
  }

  @Post()
  @ApiOperation({ summary: 'Add a shelf, e.g. "Faith" (ADMIN+)' })
  create(@Body() body: CreateBookCollectionDto) {
    return this.collections.create(body);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Rename or reorder a shelf (ADMIN+)' })
  update(@Param('id') id: string, @Body() body: UpdateBookCollectionDto) {
    return this.collections.update(id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a shelf — its books become uncategorized, not deleted (ADMIN+)' })
  remove(@Param('id') id: string) {
    return this.collections.remove(id);
  }
}
