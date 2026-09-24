import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthAccountController } from './auth-account.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { PageAccessGuard } from './guards/page-access.guard';
import { PageAccessService } from './page-access/page-access.service';
import { EffectiveRolesService } from './effective-roles.service';
import { PrismaModule } from '../prisma/prisma.module';
import { OnlineAttendanceModule } from '../online-attendance/online-attendance.module';
import { AuthSupabaseService } from './services/auth-supabase.service';
import { AuthProfileSummaryService } from './services/auth-profile-summary.service';
import { SuperAdminBootstrapService } from './services/super-admin-bootstrap.service';
import { AuthLoginService } from './services/auth-login.service';
import { AuthSessionService } from './services/auth-session.service';
import { AuthPasswordService } from './services/auth-password.service';
import { AuthMeService } from './services/auth-me.service';

@Module({
  imports: [PrismaModule, PassportModule, OnlineAttendanceModule],
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
    PageAccessService,
    // Order matters: global guards run in registration order. PageAccessGuard
    // needs the signed-in user from JwtAuthGuard, and RolesGuard must see the
    // page-permission elevation PageAccessGuard applies.
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: PageAccessGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
  exports: [EffectiveRolesService, PageAccessService],
})
export class AuthModule {}
