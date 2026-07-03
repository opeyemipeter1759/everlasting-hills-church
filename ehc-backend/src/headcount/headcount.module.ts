import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { HeadcountController } from './headcount.controller';
import { HeadcountService } from './headcount.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [HeadcountController],
  providers: [HeadcountService],
  exports: [HeadcountService],
})
export class HeadcountModule {}
