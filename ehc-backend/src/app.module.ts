import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { FormsModule } from './forms/forms.module';
import { AttendanceModule } from './attendance/attendance.module';
import { SermonsModule } from './sermons/sermons.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { MembersModule } from './members/members.module';

@Module({
  imports: [
    // ConfigModule.forRoot was removed from here to avoid a TypeScript
    // resolution issue; environment validation is performed in `main.ts`.
    PrismaModule,
    AuthModule,
    FormsModule,
    AttendanceModule,
    SermonsModule,
    AnalyticsModule,
    MembersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
