import { RequestMethod } from '@nestjs/common';
import { METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { IS_PUBLIC_KEY } from '../auth/decorators/public.decorator';
import { TestimonialsController } from './testimonials.controller';

/**
 * The homepage's "My Everlasting Hills Experience" section fetches
 * GET /testimonials/published with no login (everlasting-hills-church/data/testimonials.ts).
 * It was once removed as "unused" because that call doesn't go through lib/api.
 */
describe('GET /testimonials/published', () => {
  const proto = TestimonialsController.prototype as unknown as Record<string, () => unknown>;
  const handler = proto.listPublished;

  it('exists, is a public GET, and returns published testimonials', async () => {
    expect(Reflect.getMetadata(PATH_METADATA, handler)).toBe('published');
    expect(Reflect.getMetadata(METHOD_METADATA, handler)).toBe(RequestMethod.GET);
    expect(Reflect.getMetadata(IS_PUBLIC_KEY, handler)).toBe(true);

    const service = { listPublished: jest.fn().mockResolvedValue([{ id: 't1' }]) };
    const controller = new TestimonialsController(service as never);
    await expect(controller.listPublished('5')).resolves.toEqual([{ id: 't1' }]);
    expect(service.listPublished).toHaveBeenCalledWith(5);
  });

  it('is declared before the :id routes, so "published" is never read as an id', () => {
    const names = Object.getOwnPropertyNames(TestimonialsController.prototype);
    const firstById = names.findIndex((n) => Reflect.getMetadata(PATH_METADATA, proto[n]) === ':id');
    expect(names.indexOf('listPublished')).toBeLessThan(firstById);
  });
});
