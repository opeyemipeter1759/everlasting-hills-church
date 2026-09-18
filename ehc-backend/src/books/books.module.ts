import { Module } from '@nestjs/common';
import { BookCollectionsModule } from '../book-collections/book-collections.module';
import { BooksController } from './books.controller';
import { BooksService } from './books.service';

@Module({
  imports: [BookCollectionsModule],
  controllers: [BooksController],
  providers: [BooksService],
})
export class BooksModule {}
