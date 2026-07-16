import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import type { AuthUser } from '../auth/types/auth-user';
import { CoursesService } from './courses.service';

/**
 * Discipleship course catalog. Read routes (list, detail-by-slug, my progress) and
 * enrollment/exam routes are open to any authenticated member; catalog management
 * (create/update/delete, and the exam-answers-included admin detail) is @Roles(ADMIN).
 *
 * Literal routes (progress/me, admin/:id) are declared before the generic :slug route
 * per this codebase's convention, even though differing segment counts mean there's no
 * actual collision here.
 */
@ApiTags('courses')
@Controller('courses')
@ApiBearerAuth('access-token')
export class CoursesController {
  constructor(private readonly courses: CoursesService) {}

  // ── Reads ────────────────────────────────────────────────────────────────────

  @Get()
  @ApiOperation({ summary: 'List the course catalog (any authenticated user)' })
  list() {
    return this.courses.list();
  }

  @Get('progress/me')
  @ApiOperation({ summary: "Current user's enrollment/exam progress across all courses" })
  myProgress(@CurrentUser() user: AuthUser) {
    return this.courses.myProgress(user);
  }

  @Get('admin/:id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Full course detail incl. exam answers, for the admin editor (ADMIN+)' })
  getForAdmin(@Param('id') id: string) {
    return this.courses.getForAdmin(id);
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Course detail by slug — exam options only, no correct answers' })
  getBySlug(@Param('slug') slug: string) {
    return this.courses.getBySlug(slug);
  }

  // ── Admin: CRUD ──────────────────────────────────────────────────────────────

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Create a course (ADMIN+)' })
  create(@CurrentUser() user: AuthUser, @Body() body: unknown) {
    return this.courses.create(user, body);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update a course, incl. curriculum and exam (ADMIN+)' })
  update(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() body: unknown) {
    return this.courses.update(user, id, body);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete a course; dependents lose it as a prerequisite (ADMIN+)' })
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.courses.remove(user, id);
  }

  // ── Member: enrollment + exam ────────────────────────────────────────────────

  @Post(':id/enroll')
  @ApiOperation({ summary: 'Enroll the current user in a course' })
  enroll(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.courses.enroll(user, id);
  }

  @Post(':id/exam/submit')
  @ApiOperation({ summary: "Submit exam answers; graded server-side, 100% completes the course" })
  submitExam(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() body: unknown) {
    return this.courses.submitExam(user, id, body);
  }

  @Post(':id/lessons/:lessonId/watched')
  @ApiOperation({ summary: 'Mark a lesson watched to completion for the current user' })
  markLessonWatched(@CurrentUser() user: AuthUser, @Param('id') id: string, @Param('lessonId') lessonId: string) {
    return this.courses.markLessonWatched(user, id, lessonId);
  }

  @Post(':id/modules/:moduleId/check/submit')
  @ApiOperation({ summary: "Submit a module's checkpoint answer; graded server-side, gates the next module" })
  submitModuleCheck(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Param('moduleId') moduleId: string,
    @Body() body: unknown,
  ) {
    return this.courses.submitModuleCheck(user, id, moduleId, body);
  }
}
