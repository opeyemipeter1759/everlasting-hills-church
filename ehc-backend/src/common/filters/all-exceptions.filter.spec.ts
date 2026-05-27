import {
  ArgumentsHost,
  BadRequestException,
  HttpException,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AllExceptionsFilter } from './all-exceptions.filter';

/**
 * AllExceptionsFilter tests.
 *
 * We verify:
 *   - The envelope shape is stable: { error: { statusCode, message, code, requestId } }
 *   - Prisma error codes are mapped to proper HTTP statuses
 *   - ValidationPipe message arrays surface as `details`
 *   - Production hides stack traces
 *   - Every error has a requestId
 */

function makeHost(): {
  host: ArgumentsHost;
  response: {
    status: jest.Mock;
    json: jest.Mock;
    setHeader: jest.Mock;
    _status: number;
    _body: unknown;
  };
  request: { headers: Record<string, string>; method: string; url: string };
} {
  // Build the response, then attach mocks that capture into _status/_body.
  // Avoid .bind() — it strips jest.Mock metadata, breaking toHaveBeenCalledWith.
  const response = {
    _status: 0,
    _body: undefined as unknown,
    status: jest.fn(),
    json: jest.fn(),
    setHeader: jest.fn(),
  };
  response.status.mockImplementation((code: number) => {
    response._status = code;
    return response;
  });
  response.json.mockImplementation((body: unknown) => {
    response._body = body;
    return response;
  });

  const request = { headers: {}, method: 'GET', url: '/test' };
  const host = {
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => response,
    }),
  } as unknown as ArgumentsHost;
  return { host, response, request };
}

describe('AllExceptionsFilter', () => {
  let filter: AllExceptionsFilter;

  beforeEach(() => {
    filter = new AllExceptionsFilter();
  });

  it('wraps HttpException in error envelope with requestId', () => {
    const { host, response } = makeHost();
    filter.catch(new NotFoundException('Sermon not found'), host);

    expect(response.status).toHaveBeenCalledWith(404);
    expect(response._body).toMatchObject({
      error: {
        statusCode: 404,
        message: 'Sermon not found',
        code: 'NOT_FOUND',
        requestId: expect.stringMatching(/[0-9a-f-]{36}/),
      },
    });
  });

  it('reuses x-request-id from incoming request header if present', () => {
    const { host, response, request } = makeHost();
    request.headers['x-request-id'] = 'caller-supplied-id-42';

    filter.catch(new NotFoundException(), host);

    const body = response._body as { error: { requestId: string } };
    expect(body.error.requestId).toBe('caller-supplied-id-42');
    expect(response.setHeader).toHaveBeenCalledWith('x-request-id', 'caller-supplied-id-42');
  });

  it('extracts ValidationPipe field errors into `details`', () => {
    const { host, response } = makeHost();
    const validationError = new BadRequestException({
      statusCode: 400,
      message: ['email must be a valid email', 'password must be at least 6 characters'],
      error: 'Bad Request',
    });

    filter.catch(validationError, host);

    const body = response._body as { error: { details?: string[]; message: string } };
    expect(body.error.details).toEqual([
      'email must be a valid email',
      'password must be at least 6 characters',
    ]);
    expect(body.error.message).toBe('email must be a valid email');
  });

  it('maps Prisma P2002 unique-constraint to HTTP 409', () => {
    const { host, response } = makeHost();
    const err = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
      code: 'P2002',
      clientVersion: '6.0.0',
      meta: { target: ['email'] },
    });

    filter.catch(err, host);

    expect(response.status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
    const body = response._body as { error: { message: string; code: string } };
    expect(body.error.code).toBe('UNIQUE_CONSTRAINT_VIOLATION');
    expect(body.error.message).toContain('email');
  });

  it('maps Prisma P2025 record-not-found to HTTP 404', () => {
    const { host, response } = makeHost();
    const err = new Prisma.PrismaClientKnownRequestError('Record not found', {
      code: 'P2025',
      clientVersion: '6.0.0',
    });

    filter.catch(err, host);

    expect(response.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    const body = response._body as { error: { code: string } };
    expect(body.error.code).toBe('NOT_FOUND');
  });

  it('maps Prisma P2003 foreign-key violation to HTTP 400', () => {
    const { host, response } = makeHost();
    const err = new Prisma.PrismaClientKnownRequestError('FK violation', {
      code: 'P2003',
      clientVersion: '6.0.0',
    });

    filter.catch(err, host);
    expect(response.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
  });

  it('returns generic 500 for unknown errors and does NOT leak the raw message', () => {
    const { host, response } = makeHost();
    filter.catch(new Error('Internal Prisma boom — schema column foo missing'), host);

    expect(response.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    const body = response._body as { error: { message: string; code: string } };
    expect(body.error.message).toBe('Internal server error');
    expect(body.error.code).toBe('INTERNAL_SERVER_ERROR');
  });

  it('omits stack trace when NODE_ENV=production', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    try {
      const { host, response } = makeHost();
      filter.catch(new Error('Boom'), host);
      const body = response._body as { error: { stack?: string } };
      expect(body.error.stack).toBeUndefined();
    } finally {
      process.env.NODE_ENV = originalEnv;
    }
  });

  it('includes stack trace in development', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    try {
      const { host, response } = makeHost();
      filter.catch(new Error('Boom'), host);
      const body = response._body as { error: { stack?: string } };
      expect(body.error.stack).toContain('Error: Boom');
    } finally {
      process.env.NODE_ENV = originalEnv;
    }
  });

  it('passes through HttpException with string response', () => {
    const { host, response } = makeHost();
    filter.catch(new HttpException('Custom message', 418), host);

    expect(response.status).toHaveBeenCalledWith(418);
    const body = response._body as { error: { message: string; statusCode: number } };
    expect(body.error.message).toBe('Custom message');
    expect(body.error.statusCode).toBe(418);
  });
});
