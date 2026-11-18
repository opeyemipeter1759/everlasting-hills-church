import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditTrailController } from './audit-trail.controller';
import { AuditTrailInterceptor } from './audit-trail.interceptor';
import { AuditTrailService } from './audit-trail.service';

/** The general audit trail: the interceptor records every change people make; the controller reads it back. */
@Module({
  imports: [PrismaModule],
  controllers: [AuditTrailController],
  providers: [AuditTrailService, { provide: APP_INTERCEPTOR, useClass: AuditTrailInterceptor }],
})
export class AuditTrailModule {}
