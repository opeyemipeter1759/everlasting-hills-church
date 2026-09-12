import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ServiceTeamsController } from './service-teams.controller';
import { ServiceTeamsService } from './service-teams.service';

@Module({
  imports: [PrismaModule],
  controllers: [ServiceTeamsController],
  providers: [ServiceTeamsService],
})
export class ServiceTeamsModule {}
