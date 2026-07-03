import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { HeadcountModule } from '../headcount/headcount.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [PrismaModule, HeadcountModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
