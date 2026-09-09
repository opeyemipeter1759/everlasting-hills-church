import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { NavPermissionsController } from './nav-permissions.controller';
import { NavPermissionsService } from './services/nav-permissions.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [NavPermissionsController],
  providers: [NavPermissionsService],
})
export class NavPermissionsModule {}
