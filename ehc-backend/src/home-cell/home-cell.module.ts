import { Module } from '@nestjs/common';
import { HomeCellController } from './home-cell.controller';
import { HomeCellService } from './home-cell.service';

@Module({
  controllers: [HomeCellController],
  providers: [HomeCellService],
})
export class HomeCellModule {}
