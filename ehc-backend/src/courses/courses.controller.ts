import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import type { AuthUser } from '../auth/types/auth-user';
import { CoursesReadService } from './services/courses-read.service';
import { CoursesCrudService } from './services/courses-crud.service';
import { CourseCategoryService } from './services/course-category.service';
import { CourseProgressService } from './services/course-progress.service';
import { CourseEnrollmentService } from './services/course-enrollment.service';

/**
 * Discipleship course catalog. Read routes (list, detail-by-slug, my progress) and
 * enrollment/exam routes are open to any authenticated member; catalog management
 * (create/update/delete, and the exam-answers-included admin detail) is @Roles(ADMIN).
 *
 * Literal routes (progress/me, admin/:id, categories) are declared before the generic
 * :slug route — 'categories' in particular shares its 1-segment GET shape with :slug,
 * so this order is load-bearing, not just convention.
 */
@ApiTags('courses')
@Controller('courses')
@ApiBearerAuth('access-token')
export class CoursesController {
  constructor(
    private readonly read: CoursesReadService,
    private readonly crud: CoursesCrudService,
    private readonly category: CourseCategoryService,
    private readonly progress: CourseProgressService,
    private readonly enrollment: CourseEnrollmentService,
  ) {}

  // ── Reads ────────────────────────────────────────────────────────────────────

  @Get()
  @ApiOperation({ summary: 'List the course catalog (any authenticated user)' })
  list() {
    return this.read.list();
  }

  @Get('progress/me')
  @ApiOperation({ summary: "Current user's enrollment/exam progress across all courses" })
  myProgress(@CurrentUser() user: AuthUser) {
    return this.progress.myProgress(user);
  }

  @Get('admin/:id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Full course detail incl. exam answers, for the admin editor (ADMIN+)' })
  getForAdmin(@Param('id') id: string) {
    return this.read.getForAdmin(id);
  }

  @Get('categories')
  @ApiOperation({ summary: 'List the course category tree (any authenticated user)' })
  listCategories() {
    return this.category.listCategories();
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Course detail by slug — exam options only, no correct answers' })
  getBySlug(@Param('slug') slug: string) {
    return this.read.getBySlug(slug);
  }

  // ── Admin: CRUD ──────────────────────────────────────────────────────────────

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Create a course (ADMIN+)' })
  create(@CurrentUser() user: AuthUser, @Body() body: unknown) {
    return this.crud.create(user, body);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update a course, incl. curriculum and exam (ADMIN+)' })
  update(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() body: unknown) {
    return this.crud.update(user, id, body);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete a course; dependents lose it as a prerequisite (ADMIN+)' })
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.crud.remove(user, id);
  }

  // ── Admin: category CRUD ─────────────────────────────────────────────────────

  @Post('categories')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Create a course category, optionally nested under a parent (ADMIN+)' })
  createCategory(@CurrentUser() user: AuthUser, @Body() body: unknown) {
    return this.category.createCategory(user, body);
  }

  @Patch('categories/:id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Rename or reparent a course category (ADMIN+)' })
  updateCategory(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() body: unknown) {
    return this.category.updateCategory(user, id, body);
  }

  @Delete('categories/:id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete an empty course category (no subcategories or courses) (ADMIN+)' })
  removeCategory(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.category.removeCategory(user, id);
  }

  // ── Member: enrollment + exam ────────────────────────────────────────────────

  @Post(':id/enroll')
  @ApiOperation({ summary: 'Enroll the current user in a course' })
  enroll(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.enrollment.enroll(user, id);
  }

  @Post(':id/exam/submit')
  @ApiOperation({ summary: "Submit exam answers; graded server-side, 100% completes the course" })
  submitExam(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() body: unknown) {
    return this.enrollment.submitExam(user, id, body);
  }

  @Post(':id/lessons/:lessonId/watched')
  @ApiOperation({ summary: 'Mark a lesson watched to completion for the current user' })
  markLessonWatched(@CurrentUser() user: AuthUser, @Param('id') id: string, @Param('lessonId') lessonId: string) {
    return this.progress.markLessonWatched(user, id, lessonId);
  }

  @Post(':id/modules/:moduleId/check/submit')
  @ApiOperation({ summary: "Submit a module's checkpoint answer; graded server-side, gates the next module" })
  submitModuleCheck(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Param('moduleId') moduleId: string,
    @Body() body: unknown,
  ) {
    return this.progress.submitModuleCheck(user, id, moduleId, body);
  }
}
