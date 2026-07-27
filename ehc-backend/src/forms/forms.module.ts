import { Module } from '@nestjs/common';
import { FormsController } from './forms.controller';
import { FormsMiscController } from './forms-misc.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { FormsEmailDispatchService } from './services/forms-email-dispatch.service';
import { FirstTimerFormService } from './services/first-timer-form.service';
import { PrayerRequestFormService } from './services/prayer-request-form.service';
import { QuestionFormService } from './services/question-form.service';
import { TestimonyFormService } from './services/testimony-form.service';
import { ServeTeamFormService } from './services/serve-team-form.service';
import { ContactFormService } from './services/contact-form.service';
import { HomeCellFormService } from './services/home-cell-form.service';

@Module({
  imports: [PrismaModule],
  controllers: [FormsController, FormsMiscController],
  providers: [
    FormsEmailDispatchService,
    FirstTimerFormService,
    PrayerRequestFormService,
    QuestionFormService,
    TestimonyFormService,
    ServeTeamFormService,
    ContactFormService,
    HomeCellFormService,
  ],
})
export class FormsModule {}
