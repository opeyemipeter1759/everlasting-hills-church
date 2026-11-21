import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  PayloadTooLargeException,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { CounsellingRequirementKind } from '@prisma/client';
import type { Request, Response } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { AllowCoupleAccount } from '../../auth/decorators/couple-account.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { AuthUser } from '../../auth/types/auth-user';
import { parseSchema } from '../../common/zod-parse.util';
import { REQUIREMENT_KINDS } from '../documents/document-rules';
import { DocumentsConfigService } from '../documents/documents-config';
import { CoupleDashboardService } from './couple-dashboard.service';

const kindSchema = z.enum(REQUIREMENT_KINDS as unknown as [CounsellingRequirementKind, ...CounsellingRequirementKind[]], {
  error: 'Not a document we ask for',
});
const letterSchema = z.enum(['consent', 'medical'], { error: 'Not a letter we send' });

/**
 * The couple dashboard, for both partners. A couple account (no Profile) may
 * reach these routes and nothing else; a member reaches them from their usual
 * dashboard. Everything is scoped to the caller's own application, found by
 * their sign-in, never by an id in the request.
 */
@ApiTags('premarital-couple')
@ApiBearerAuth('access-token')
@AllowCoupleAccount()
@Controller('counselling/me')
export class CoupleController {
  constructor(
    private readonly dashboard: CoupleDashboardService,
    private readonly config: DocumentsConfigService,
  ) {}

  @Get()
  @ApiOperation({ summary: "The caller's application, sessions, materials and documents" })
  overview(@CurrentUser() actor: AuthUser, @Res({ passthrough: true }) res: Response) {
    res.setHeader('Cache-Control', 'no-store');
    return this.dashboard.overview(actor);
  }

  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @Post('documents/consent')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Record consent to store your medical certificate' })
  consent(@CurrentUser() actor: AuthUser, @Body() body: unknown) {
    const { kind } = parseSchema(z.object({ kind: kindSchema }), body);
    return this.dashboard.consent(actor, kind);
  }

  @Throttle({ default: { limit: 20, ttl: 3_600_000 } })
  @Post('documents/:kind/upload')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Upload or replace one document (PDF, JPG or PNG)' })
  async upload(@CurrentUser() actor: AuthUser, @Req() req: Request, @Res({ passthrough: true }) res: Response, @Param('kind') rawKind: string) {
    const kind = parseSchema(kindSchema, rawKind);
    // Checked before a single byte of the file is read, and again inside.
    await this.dashboard.checkUpload(actor, kind);
    const { maxUploadMb } = await this.config.values();
    const file = await readOneFile(req, res, maxUploadMb);
    return this.dashboard.upload(actor, kind, file);
  }

  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @Get('letters/:kind')
  @ApiOperation({ summary: 'Download the consent letter or the medical screening letter' })
  async letter(@CurrentUser() actor: AuthUser, @Param('kind') rawKind: string, @Res() res: Response) {
    const kind = parseSchema(letterSchema, rawKind);
    const pdf = await this.dashboard.letter(actor, kind);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${kind === 'consent' ? 'Parental-Consent' : 'Medical-Screening-Requirement'}.pdf"`);
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.send(pdf);
  }
}

/** Reads the single "file" field into memory, stopping at the size limit. */
function readOneFile(req: Request, res: Response, maxMb: number): Promise<Buffer | undefined> {
  const parse = multer({ storage: multer.memoryStorage(), limits: { fileSize: maxMb * 1024 * 1024, files: 1, fields: 4, parts: 6 } }).single('file');
  return new Promise((resolve, reject) => {
    parse(req, res, (err: unknown) => {
      if (err) {
        const code = (err as { code?: string }).code;
        if (code === 'LIMIT_FILE_SIZE') return reject(new PayloadTooLargeException(`That file is bigger than ${maxMb} MB. Please upload a smaller copy.`));
        return reject(new BadRequestException('We could not read that upload. Please try again.'));
      }
      resolve((req as Request & { file?: { buffer: Buffer } }).file?.buffer);
    });
  });
}
