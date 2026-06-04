import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Resolves the tenant from request context — the `x-tenant-id` header here; a
 * subdomain or auth-derived claim in production. Crucially it is NEVER read from the
 * request body, so a client cannot pose as another tenant. Returns `undefined` when
 * absent; the read service falls back to the configured default tenant.
 */
export const TenantId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string | undefined => {
    const req = ctx.switchToHttp().getRequest<{ headers: Record<string, unknown> }>();
    const raw = req.headers['x-tenant-id'];
    const value = Array.isArray(raw) ? raw[0] : raw;
    return typeof value === 'string' && value.trim() ? value.trim() : undefined;
  },
);
