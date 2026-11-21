import { Body, Controller, Get, HttpCode, HttpStatus, Param, PayloadTooLargeException, BadRequestException, Post, Req, Res } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { Public } from '../../auth/decorators/public.decorator';
import { parseSchema } from '../../common/zod-parse.util';
import {
  clearCookieHeader,
  cookieFrom,
  CoupleAccessService,
  setCookieHeader,
} from './couple-access.service';
import { CoupleDocumentsService } from './couple-documents.service';
import { REQUIREMENT_KINDS } from './document-rules';
import { DocumentsConfigService } from './documents-config';

const kindSchema = z.enum(REQUIREMENT_KINDS as unknown as ['PARENTAL_CONSENT', 'MEDICAL_CERT_GROOM', 'MEDICAL_CERT_BRIDE'], {
  error: 'Not a document we ask for',
});

/**
 * The couple's documents page (no account). The link token arrives in the
 * body, never the URL; after that a signed httpOnly cookie, scoped to these
 * routes, carries the session. Nothing here returns a file. Rate limited per
 * visitor, and per link in the services.
 */
@ApiTags('premarital-documents-public')
@Controller('public/premarital/documents')
export class CoupleDocumentsController {
  constructor(
    private readonly access: CoupleAccessService,
    private readonly documents: CoupleDocumentsService,
    private readonly config: DocumentsConfigService,
  ) {}

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('access')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Swap the link token for a session cookie' })
  async exchange(@Body() body: unknown, @Res({ passthrough: true }) res: Response) {
    const { token } = parseSchema(z.object({ token: z.string().min(20).max(200) }), body);
    const out = await this.access.exchange(token);
    this.noStore(res).setHeader('Set-Cookie', setCookieHeader(out.cookie, out.maxAge));
    return { stage: out.stage };
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('code')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Email a six-digit code' })
  async code(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    await this.access.sendCode(cookieFrom(req.headers.cookie));
    this.noStore(res);
    return { sent: true };
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('code/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Check the code' })
  async verify(@Req() req: Request, @Body() body: unknown, @Res({ passthrough: true }) res: Response) {
    const { code } = parseSchema(z.object({ code: z.string().trim().regex(/^\d{6}$/, 'Enter the six digits from the email') }), body);
    const out = await this.access.verifyCode(cookieFrom(req.headers.cookie), code);
    this.noStore(res).setHeader('Set-Cookie', setCookieHeader(out.cookie, out.maxAge));
    return { stage: 'READY' as const };
  }

  @Public()
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  @Get()
  @ApiOperation({ summary: 'First names, reference, and the status of each document in scope' })
  async page(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const session = await this.access.requireVerified(cookieFrom(req.headers.cookie));
    this.noStore(res);
    return this.documents.page(session);
  }

  @Public()
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @Post('consent')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Record consent to store a medical certificate' })
  async consent(@Req() req: Request, @Body() body: unknown) {
    const session = await this.access.requireVerified(cookieFrom(req.headers.cookie));
    const { kind } = parseSchema(z.object({ kind: kindSchema }), body);
    return this.documents.consent(session, kind);
  }

  @Public()
  @Throttle({ default: { limit: 20, ttl: 3_600_000 } })
  @Post(':kind/upload')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Upload or replace one document (PDF, JPG or PNG)' })
  async upload(@Req() req: Request, @Res({ passthrough: true }) res: Response, @Param('kind') rawKind: string) {
    // The session is checked before a single byte of the file is read.
    const session = await this.access.requireVerified(cookieFrom(req.headers.cookie));
    const kind = parseSchema(kindSchema, rawKind);
    this.documents.assertUploadsEnabled();
    const { maxUploadMb } = await this.config.values();
    const file = await readOneFile(req, res, maxUploadMb);
    return this.documents.upload(session, kind, file);
  }

  @Public()
  @Post('sign-out')
  @HttpCode(HttpStatus.OK)
  signOut(@Res({ passthrough: true }) res: Response) {
    this.noStore(res).setHeader('Set-Cookie', clearCookieHeader());
    return { signedOut: true };
  }

  private noStore(res: Response) {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Referrer-Policy', 'no-referrer');
    return res;
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
