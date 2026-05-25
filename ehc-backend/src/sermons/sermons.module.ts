import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { SermonsController } from './sermons.controller';
import { SermonsService } from './sermons.service';


@Module({
  imports: [PrismaModule],
  controllers: [SermonsController],
  providers: [SermonsService],
})
export class SermonsModule {}
