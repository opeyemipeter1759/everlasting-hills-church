import { Module } from '@nestjs/common';
import { OneOnOneController } from './one-on-one.controller';
import { OneOnOneService } from './one-on-one.service';

@Module({
  controllers: [OneOnOneController],
  providers: [OneOnOneService],
})
export class OneOnOneModule {}
