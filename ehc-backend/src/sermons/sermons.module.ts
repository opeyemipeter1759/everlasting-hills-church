import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { SermonsController } from './sermons.controller';
import { SermonsService } from './sermons.service';
import { AuthModule } from '../auth/auth.module';
import { SermonReadService } from './recent/sermon-read.service';
import { SERMON_REPOSITORY } from './recent/sermon-repository';
import { PrismaSermonRepository } from './recent/prisma-sermon.repository';
import { InMemorySermonRepository } from './recent/in-memory-sermon.repository';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [SermonsController],
  providers: [
    SermonsService,
    SermonReadService,
    // The seam: swap this binding (e.g. to InMemorySermonRepository for tests/local)
    // without touching the controller or read service.
    PrismaSermonRepository,
    InMemorySermonRepository,
    { provide: SERMON_REPOSITORY, useClass: PrismaSermonRepository },
  ],
})
export class SermonsModule {}
