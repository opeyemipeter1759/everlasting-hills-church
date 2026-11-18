import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { PATH_METADATA } from '@nestjs/common/constants';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { DECORATORS } from '@nestjs/swagger';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import type { Request, Response } from 'express';
import { from, mergeMap, Observable, switchMap } from 'rxjs';
import type { AuthUser } from '../auth/types/auth-user';
import type { Env } from '../config/env.validation';
import { PrismaService } from '../prisma/prisma.service';
import { REQUEST } from './audit-feed';
import { bodyIsPrivate, MUTATING_METHODS, sanitizeBody, skipRoute } from './audit-rules';
import { type AuditTarget, primaryId, resolveTargets } from './audit-targets';

function joinPath(...parts: unknown[]): string {
  const segs = parts.flatMap((p) => (Array.isArray(p) ? p[0] : p)).filter((p): p is string => typeof p === 'string');
  const path = segs.map((s) => s.replace(/^\/+|\/+$/g, '')).filter(Boolean).join('/');
  return `/${path}`;
}

/**
 * The general audit trail: every change a signed-in person makes through the
 * API (create, edit, delete, approve, assign, send) is kept with who did it,
 * when, what it was ("Grant a global role"), who or what it was about, and the
 * details they sent, secrets hidden. Written once the change has succeeded, and
 * awaited, so the row is in before the answer goes back. A failed write is
 * logged and never fails the change itself.
 */
@Injectable()
export class AuditTrailInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditTrailInterceptor.name);
  private readonly tenantId: string;

  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  intercept(ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (ctx.getType() !== 'http') return next.handle();
    const req = ctx.switchToHttp().getRequest<Request & { user?: AuthUser }>();
    const method = (req.method ?? '').toUpperCase();
    const user = req.user;
    if (!MUTATING_METHODS.has(method) || !user?.userId) return next.handle();

    const route = joinPath(this.reflector.get(PATH_METADATA, ctx.getClass()), this.reflector.get(PATH_METADATA, ctx.getHandler()));
    if (skipRoute(route)) return next.handle();

    const tags = this.reflector.getAllAndOverride<string[] | undefined>(DECORATORS.API_TAGS, [ctx.getHandler(), ctx.getClass()]);
    const operation = this.reflector.get<{ summary?: string } | undefined>(DECORATORS.API_OPERATION, ctx.getHandler());
    const area = tags?.[0] ?? route.split('/')[1] ?? 'other';
    const params = { ...(req.params as Record<string, string>) };
    const res = ctx.switchToHttp().getResponse<Response>();

    return from(resolveTargets(this.prisma, area, params).catch(() => [] as AuditTarget[])).pipe(
      switchMap((targets) =>
        next.handle().pipe(
          mergeMap(async (data: unknown) => {
            await this.write({ user, method, route, area, summary: operation?.summary, params, targets, req, status: res.statusCode });
            return data;
          }),
        ),
      ),
    );
  }

  private async write(e: {
    user: AuthUser;
    method: string;
    route: string;
    area: string;
    summary?: string;
    params: Record<string, string>;
    targets: AuditTarget[];
    req: Request;
    status: number;
  }) {
    const hidden = bodyIsPrivate(e.route);
    const query = sanitizeBody(e.req.query);
    const after = {
      summary: e.summary ?? null,
      method: e.method,
      route: e.route,
      path: (e.req.originalUrl ?? e.req.url ?? '').split('?')[0],
      params: e.params,
      ...(query ? { query } : {}),
      ...(hidden ? { bodyHidden: true } : { body: sanitizeBody(e.req.body) }),
      targets: e.targets,
      status: e.status,
    };
    try {
      await this.prisma.auditLog.create({
        data: {
          id: randomUUID(),
          tenantId: this.tenantId,
          actorId: e.user.userId,
          action: REQUEST, // a service's own rows keep theirs (CREATE, DELETE…)
          entity: e.area,
          entityId: primaryId(e.params),
          before: Prisma.DbNull,
          after: after as unknown as Prisma.InputJsonValue,
        },
      });
    } catch (err) {
      this.logger.error(`Audit trail write failed (${e.method} ${e.route}): ${(err as Error).message}`);
    }
  }
}
