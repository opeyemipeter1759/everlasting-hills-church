import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { FormsModule } from './forms/forms.module';
import { SermonsModule } from './sermons/sermons.module';

@Module({
  imports: [
    // ConfigModule.forRoot was removed from here to avoid a TypeScript
    // resolution issue; environment validation is performed in `main.ts`.
    PrismaModule,
    AuthModule,
    FormsModule,
    SermonsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
