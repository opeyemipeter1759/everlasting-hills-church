import { Body, Controller, Get, HttpCode, HttpStatus, Param, Patch, Post, Put, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import type { Response } from 'express';
import { z } from 'zod';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import type { AuthUser } from '../../auth/types/auth-user';
import { parseSchema } from '../../common/zod-parse.util';
import { DocumentLettersService } from './document-letters.service';
import { DocumentsAdminService } from './documents-admin.service';
import { DocumentsConfigService } from './documents-config';

const letterKind = z.enum(['PARENTAL_CONSENT', 'MEDICAL_SCREENING'], { error: 'Not a letter' });

function sendFile(res: Response, data: Buffer, type: string, disposition: 'inline' | 'attachment', name: string) {
  res.setHeader('Content-Type', type);
  res.setHeader('Content-Disposition', `${disposition}; filename="${name}"`);
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.send(data);
}

/**
 * Counselling documents for the marriage team. Who may do what is decided per
 * case and per document (CaseAccess, then DocumentRules); anything a person
 * may not see answers 404.
 */
@ApiTags('premarital')
@Controller('premarital')
@Roles(Role.MEMBER)
@ApiBearerAuth('access-token')
export class PremaritalDocumentsController {
  constructor(
    private readonly admin: DocumentsAdminService,
    private readonly letters: DocumentLettersService,
    private readonly config: DocumentsConfigService,
  ) {}

  @Get('applications/:id/documents')
  @ApiOperation({ summary: "The document checklist, the partners' sign-ins and the email log for a case" })
  list(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.admin.list(user, id);
  }

  @Post('documents/:requirementId/view-ticket')
  @ApiOperation({ summary: 'A single-use, one-minute ticket to open the current file' })
  viewTicket(@CurrentUser() user: AuthUser, @Param('requirementId') requirementId: string) {
    return this.admin.viewTicket(user, requirementId);
  }

  @Post('documents/view')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Open a file with a ticket, sent in the body so it never sits in a URL or log' })
  async view(@CurrentUser() user: AuthUser, @Body() body: unknown, @Res() res: Response) {
    const { ticket } = parseSchema(z.object({ ticket: z.string().min(20).max(100) }), body);
    const { data, mimeType } = await this.admin.view(user, ticket);
    sendFile(res, data, mimeType, 'inline', mimeType === 'application/pdf' ? 'document.pdf' : 'document');
  }

  @Post('documents/:requirementId/verify')
  @ApiOperation({ summary: 'Accept a document (medical: with the test date)' })
  verify(@CurrentUser() user: AuthUser, @Param('requirementId') requirementId: string, @Body() body: unknown) {
    return this.admin.verify(user, requirementId, body);
  }

  @Post('documents/:requirementId/request-reupload')
  @ApiOperation({ summary: 'Ask the couple to upload a document again, with a reason' })
  reupload(@CurrentUser() user: AuthUser, @Param('requirementId') requirementId: string, @Body() body: unknown) {
    return this.admin.requestReupload(user, requirementId, body);
  }

  @Post('documents/:requirementId/reopen')
  @ApiOperation({ summary: 'Pastor: reopen an accepted document' })
  reopen(@CurrentUser() user: AuthUser, @Param('requirementId') requirementId: string) {
    return this.admin.reopen(user, requirementId);
  }

  @Post('applications/:id/documents/send')
  @ApiOperation({ summary: 'Send or resend the letters, with how to sign in to the dashboard' })
  send(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.admin.send(user, id);
  }

  @Post('applications/:id/sign-in')
  @ApiOperation({ summary: "Make any missing dashboard sign-in and email both partners how to sign in" })
  resendSignIn(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.admin.resendSignIn(user, id);
  }

  @Post('applications/:id/documents/delete-stored')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Pastor: delete the stored files of a closed or archived case' })
  deleteStored(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.admin.deleteStored(user, id);
  }

  @Get('applications/:id/documents/letters/:kind/:person')
  @ApiOperation({ summary: "Download one partner's letter (consent or medical), rebuilt as it was sent" })
  async letter(@CurrentUser() user: AuthUser, @Param('id') id: string, @Param('kind') kind: string, @Param('person') person: string, @Res() res: Response) {
    const which = parseSchema(z.enum(['consent', 'medical']), kind);
    const whose = parseSchema(z.enum(['groom', 'bride']), person);
    const pdf = await this.admin.letter(user, id, which, whose === 'groom' ? 'GROOM' : 'BRIDE');
    const name = `${which === 'consent' ? 'Parental-Consent' : 'Medical-Screening-Requirement'}-${whose === 'groom' ? 'Groom' : 'Bride'}.pdf`;
    sendFile(res, pdf, 'application/pdf', 'attachment', name);
  }

  @Patch('applications/:id/role')
  @ApiOperation({ summary: 'Set who applied (groom or bride) on an older application' })
  setRole(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() body: unknown) {
    return this.admin.setRole(user, id, body);
  }

  // ---- Letters and settings (Marriage > Policy) ----

  @Get('document-templates')
  @ApiOperation({ summary: 'Every version of both letters' })
  templates(@CurrentUser() user: AuthUser) {
    return this.letters.list(user);
  }

  @Post('document-templates/:kind')
  @ApiOperation({ summary: 'Save new wording as the next draft version' })
  saveTemplate(@CurrentUser() user: AuthUser, @Param('kind') kind: string, @Body() body: unknown) {
    return this.letters.saveVersion(user, parseSchema(letterKind, kind), body);
  }

  @Post('document-templates/:kind/preview')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Preview wording on the letterhead with made-up names' })
  async preview(@CurrentUser() user: AuthUser, @Param('kind') kind: string, @Body() body: unknown, @Res() res: Response) {
    const pdf = await this.letters.preview(user, parseSchema(letterKind, kind), body);
    sendFile(res, pdf, 'application/pdf', 'inline', 'preview.pdf');
  }

  @Post('document-templates/:id/approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Pastor: approve a version; it becomes the one that is sent' })
  approve(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.letters.approve(user, id);
  }

  @Get('document-settings')
  @ApiOperation({ summary: 'The documents settings, with their approval state' })
  settings(@CurrentUser() user: AuthUser) {
    return this.config.forStaff(user);
  }

  @Put('document-settings')
  @ApiOperation({ summary: 'Pastor: save the documents settings' })
  saveSettings(@CurrentUser() user: AuthUser, @Body() body: unknown) {
    return this.config.save(user, body);
  }
}
