import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { OpenAPIObject } from '@nestjs/swagger';

const HTTP_METHODS = [
  'get',
  'put',
  'post',
  'delete',
  'options',
  'head',
  'patch',
  'trace',
] as const;

const JSON_MEDIA_TYPE = 'application/json';
const ENVELOPE_EXTENSION = 'x-response-envelope';

type PathItem = OpenAPIObject['paths'][string];
type OperationObject = NonNullable<PathItem['get']>;
type ResponseObject = Extract<
  NonNullable<OperationObject['responses'][string]>,
  { description: string }
>;
type ResponseSchema = NonNullable<
  NonNullable<ResponseObject['content']>[string]['schema']
>;

type ExtendedOperation = OperationObject & {
  [ENVELOPE_EXTENSION]?: boolean;
};

/**
 * Build the contract used by both `/docs` at runtime and the checked-in API
 * artifact. Keeping this in one place prevents the live and generated specs
 * from drifting apart.
 */
export function createOpenApiDocument(app: INestApplication): OpenAPIObject {
  const config = new DocumentBuilder()
    .setTitle('church-api')
    .setDescription('API documentation for Everlasting Hills Church')
    .setVersion('0.1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'access-token',
    )
    .build();

  // Omitting include[] makes Swagger inspect the full AppModule graph. The old
  // hand-maintained allow-list silently omitted new feature modules.
  const document = SwaggerModule.createDocument(app, config, {
    deepScanRoutes: true,
  });

  return applyGlobalResponseContracts(document);
}

export function setupOpenApi(app: INestApplication): void {
  SwaggerModule.setup('docs', app, createOpenApiDocument(app));
}

/**
 * Nest interceptors run after controller methods, so Swagger cannot infer the
 * global `{ data, meta }` success envelope from return types on its own. Apply
 * that transport contract to every JSON 2xx response after route discovery.
 *
 * Controllers that write a raw file/body with `@Res()` opt out by declaring
 * `@ApiExtension('x-response-envelope', false)`.
 */
function applyGlobalResponseContracts(document: OpenAPIObject): OpenAPIObject {
  document.components ??= {};
  document.components.schemas ??= {};
  document.components.schemas.ApiResponseMeta = {
    type: 'object',
    required: ['timestamp'],
    properties: {
      timestamp: { type: 'string', format: 'date-time' },
    },
  };
  document.components.schemas.ApiError = {
    type: 'object',
    required: ['statusCode', 'message', 'code', 'requestId'],
    properties: {
      statusCode: { type: 'integer', example: 400 },
      message: { type: 'string' },
      code: { type: 'string', example: 'BAD_REQUEST' },
      requestId: { type: 'string' },
      details: {},
      stack: {
        type: 'string',
        description: 'Present only outside production.',
      },
    },
  };
  document.components.schemas.ApiErrorEnvelope = {
    type: 'object',
    required: ['error'],
    properties: {
      error: { $ref: '#/components/schemas/ApiError' },
    },
  };

  for (const pathItem of Object.values(document.paths)) {
    for (const method of HTTP_METHODS) {
      const operation = pathItem[method] as ExtendedOperation | undefined;
      if (!operation) continue;

      const shouldWrap = operation[ENVELOPE_EXTENSION] !== false;
      delete operation[ENVELOPE_EXTENSION];

      for (const [status, responseOrRef] of Object.entries(
        operation.responses,
      )) {
        if (!responseOrRef || '$ref' in responseOrRef) continue;

        if (/^2\d\d$/.test(status) && status !== '204' && shouldWrap) {
          wrapJsonSuccessResponse(responseOrRef);
        } else if (/^[45]\d\d$/.test(status)) {
          documentJsonErrorResponse(responseOrRef);
        }
      }

      operation.responses.default ??= {
        description: 'Error response',
        content: {
          [JSON_MEDIA_TYPE]: {
            schema: { $ref: '#/components/schemas/ApiErrorEnvelope' },
          },
        },
      };
    }
  }

  return document;
}

function wrapJsonSuccessResponse(response: ResponseObject): void {
  const content = response.content;

  // Explicit non-JSON responses are downloads/feeds and bypass the interceptor.
  if (content && !content[JSON_MEDIA_TYPE]) return;

  const payloadSchema = content?.[JSON_MEDIA_TYPE]?.schema ?? {};
  response.content = {
    ...content,
    [JSON_MEDIA_TYPE]: {
      ...content?.[JSON_MEDIA_TYPE],
      schema: successEnvelope(payloadSchema),
    },
  };
}

function documentJsonErrorResponse(response: ResponseObject): void {
  response.content ??= {};
  response.content[JSON_MEDIA_TYPE] ??= {
    schema: { $ref: '#/components/schemas/ApiErrorEnvelope' },
  };
}

function successEnvelope(
  payload: ResponseSchema,
): ResponseSchema {
  return {
    type: 'object',
    required: ['data', 'meta'],
    properties: {
      data: payload,
      meta: { $ref: '#/components/schemas/ApiResponseMeta' },
    },
  } as ResponseSchema;
}
