import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { PrismaModule } from '../prisma/prisma.module';

/**
 * Globally enables:
 *   - JwtAuthGuard (every route requires a valid Supabase JWT unless @Public)
 *   - RolesGuard   (routes with @Roles enforce hierarchy)
 *
 * APP_GUARD is the canonical NestJS way to register guards application-wide
 * without touching every controller.
 */
@Module({
  imports: [PrismaModule, PassportModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
  exports: [AuthService],
})
export class AuthModule {}
