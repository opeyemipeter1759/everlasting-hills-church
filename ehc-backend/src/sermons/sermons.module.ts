import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { SermonsController } from './sermons.controller';
import { SermonsService } from './sermons.service';
import { AuthModule } from '../auth/auth.module';


@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [SermonsController],
  providers: [SermonsService],
})
export class SermonsModule {}
