import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { EmailsModule } from '../emails/emails.module';
import { CoursesController } from './courses.controller';
import { CoursesSharedService } from './services/courses-shared.service';
import { CoursesReadService } from './services/courses-read.service';
import { CoursesCrudService } from './services/courses-crud.service';
import { CourseCurriculumWriterService } from './services/course-curriculum-writer.service';
import { CourseCategoryService } from './services/course-category.service';
import { CourseProgressService } from './services/course-progress.service';
import { CourseEnrollmentService } from './services/course-enrollment.service';

@Module({
  imports: [PrismaModule, AuthModule, EmailsModule],
  controllers: [CoursesController],
  providers: [
    CoursesSharedService,
    CoursesReadService,
    CoursesCrudService,
    CourseCurriculumWriterService,
    CourseCategoryService,
    CourseProgressService,
    CourseEnrollmentService,
  ],
})
export class CoursesModule {}
