import { Module } from '@nestjs/common';
import { BookCollectionsController } from './book-collections.controller';
import { BookCollectionsService } from './book-collections.service';

@Module({
  controllers: [BookCollectionsController],
  providers: [BookCollectionsService],
  exports: [BookCollectionsService],
})
export class BookCollectionsModule {}
