import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Request, Response } from 'express';
import { randomUUID } from 'crypto';

/**
 * Standardized error envelope returned to clients.
 *
 * Why a stable shape:
 *  - Frontend can write one error renderer instead of branching on dozens of possible shapes
 *  - Per-request `requestId` makes prod debugging tractable (paste it into logs and find context)
 *  - We never leak Prisma error messages, stack traces, or DB column names in production
 */
export interface ErrorResponse {
  error: {
    statusCode: number;
    message: string;
    code: string;
    requestId: string;
    /** Field-level validation errors, when applicable (e.g. ValidationPipe). */
    details?: unknown;
    /** Only included in non-production environments. */
    stack?: string;
  };
}

/**
 * Catches every error not handled by a more specific filter.
 *
 * Order of detection matters:
 *   1. HttpException        — explicitly thrown by us; respect its status/message
 *   2. PrismaClientKnownRequestError — map known error codes (P2002 unique, P2025 not found...)
 *   3. PrismaClientValidationError    — usually a bug; 500 + log
 *   4. Anything else        — treat as 500; log full error; never expose internals
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();
    const isProd = process.env.NODE_ENV === 'production';

    const requestId = (request.headers['x-request-id'] as string | undefined) ?? randomUUID();
    const { status, message, code, details } = this.resolve(exception);

    const body: ErrorResponse = {
      error: {
        statusCode: status,
        message,
        code,
        requestId,
        ...(details !== undefined && { details }),
        ...(!isProd && exception instanceof Error && { stack: exception.stack }),
      },
    };

    // 5xx is operational concern — log full error. 4xx is user error — log at debug.
    if (status >= 500) {
      this.logger.error(
        `[${requestId}] ${request.method} ${request.url} → ${status} ${code}: ${message}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    } else {
      this.logger.debug(
        `[${requestId}] ${request.method} ${request.url} → ${status} ${code}: ${message}`,
      );
    }

    response.setHeader('x-request-id', requestId);
    response.status(status).json(body);
  }

  private resolve(exception: unknown): {
    status: number;
    message: string;
    code: string;
    details?: unknown;
  } {
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const res = exception.getResponse();
      // ValidationPipe puts { statusCode, message: string[], error } in res
      if (typeof res === 'object' && res !== null) {
        const obj = res as { message?: string | string[]; error?: string };
        const msg = Array.isArray(obj.message) ? obj.message[0] : obj.message;
        return {
          status,
          message: msg ?? exception.message,
          code: obj.error?.toUpperCase().replace(/\s+/g, '_') ?? this.statusToCode(status),
          details: Array.isArray(obj.message) ? obj.message : undefined,
        };
      }
      return {
        status,
        message: typeof res === 'string' ? res : exception.message,
        code: this.statusToCode(status),
      };
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      return this.mapPrismaKnownError(exception);
    }

    if (exception instanceof Prisma.PrismaClientValidationError) {
      // Schema-level bug; don't leak the underlying message in production.
      // In dev we surface Prisma's own error (last non-empty line) so the
      // failing field is obvious without grepping server logs.
      const isProd = process.env.NODE_ENV === 'production';
      const inner = exception.message
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean)
        .pop();
      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: isProd ? 'Invalid database operation' : `Invalid database operation: ${inner}`,
        code: 'PRISMA_VALIDATION_ERROR',
      };
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
      code: 'INTERNAL_SERVER_ERROR',
    };
  }

  /**
   * Map Prisma error codes (https://www.prisma.io/docs/reference/api-reference/error-reference)
   * to appropriate HTTP statuses. Only codes we actually expect are listed; the rest fall
   * through to a generic 500.
   */
  private mapPrismaKnownError(err: Prisma.PrismaClientKnownRequestError): {
    status: number;
    message: string;
    code: string;
  } {
    switch (err.code) {
      case 'P1001':
        return {
          status: HttpStatus.SERVICE_UNAVAILABLE,
          message: 'Database is temporarily unreachable. Please try again shortly.',
          code: 'DATABASE_UNAVAILABLE',
        };
      case 'P1002':
        return {
          status: HttpStatus.GATEWAY_TIMEOUT,
          message: 'Database connection timed out. Please try again shortly.',
          code: 'DATABASE_TIMEOUT',
        };
      case 'P2002': {
        const target = (err.meta?.target as string[] | undefined)?.join(', ') ?? 'field';
        return {
          status: HttpStatus.CONFLICT,
          message: `A record with this ${target} already exists`,
          code: 'UNIQUE_CONSTRAINT_VIOLATION',
        };
      }
      case 'P2003':
        return {
          status: HttpStatus.BAD_REQUEST,
          message: 'Related record not found',
          code: 'FOREIGN_KEY_VIOLATION',
        };
      case 'P2025':
        return {
          status: HttpStatus.NOT_FOUND,
          message: 'Record not found',
          code: 'NOT_FOUND',
        };
      default:
        return {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Database error',
          code: `PRISMA_${err.code}`,
        };
    }
  }

  private statusToCode(status: number): string {
    return (
      {
        400: 'BAD_REQUEST',
        401: 'UNAUTHORIZED',
        403: 'FORBIDDEN',
        404: 'NOT_FOUND',
        409: 'CONFLICT',
        429: 'TOO_MANY_REQUESTS',
        500: 'INTERNAL_SERVER_ERROR',
        503: 'SERVICE_UNAVAILABLE',
        504: 'GATEWAY_TIMEOUT',
      }[status] ?? `HTTP_${status}`
    );
  }
}
