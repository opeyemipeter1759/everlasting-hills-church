import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthAccountController } from './auth-account.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { EffectiveRolesService } from './effective-roles.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthSupabaseService } from './services/auth-supabase.service';
import { AuthProfileSummaryService } from './services/auth-profile-summary.service';
import { SuperAdminBootstrapService } from './services/super-admin-bootstrap.service';
import { AuthLoginService } from './services/auth-login.service';
import { AuthSessionService } from './services/auth-session.service';
import { AuthPasswordService } from './services/auth-password.service';
import { AuthMeService } from './services/auth-me.service';

@Module({
  imports: [PrismaModule, PassportModule],
  controllers: [AuthController, AuthAccountController],
  providers: [
    JwtStrategy,
    EffectiveRolesService,
    AuthSupabaseService,
    AuthProfileSummaryService,
    SuperAdminBootstrapService,
    AuthLoginService,
    AuthSessionService,
    AuthPasswordService,
    AuthMeService,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
  exports: [EffectiveRolesService],
})
export class AuthModule {}
