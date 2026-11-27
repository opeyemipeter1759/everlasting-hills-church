import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import type { AuthUser } from '../../auth/types/auth-user';
import { FollowUpPipelineController } from '../follow-up-pipeline.controller';
import { PHOTO_MAX_BYTES, PHOTO_READ_SECONDS } from './first-timer-photo.schema';
import { FirstTimerPhotoStorage } from './first-timer-photo-storage.service';
import { FirstTimerPhotosController } from './first-timer-photos.controller';
import { FirstTimerPhotosService } from './first-timer-photos.service';
import { PhotoUrlService } from './photo-url.service';

/**
 * Spec section 6 #16: the upload link refuses anything that is not a photo,
 * and anything over 5 MB; another tenant never gets
 * a read link; replacing a photo deletes the old one. Supabase is mocked: no
 * test here reaches real storage.
 */
jest.mock('@supabase/supabase-js', () => ({ createClient: jest.fn() }));

const UUID = '0b6c8f1e-3a2d-4c5b-9e7f-1a2b3c4d5e6f';
const UUID2 = '9f8e7d6c-5b4a-4321-8fed-cba987654321';
const keyOf = (visitorId: string, uuid = UUID, tenant = 't1') => `${tenant}/first-timers/${visitorId}/${uuid}.webp`;
const actor = { userId: 'u1', effectiveRoles: [], unitLeadOf: [], hodOf: [] } as unknown as AuthUser;

function setup(opts: { photoKey?: string | null; onRecord?: boolean; allowed?: boolean } = {}) {
  const bucket = {
    createSignedUploadUrl: jest.fn(async (path: string) => ({ data: { signedUrl: `https://storage.test/upload/${path}?token=tok`, token: 'tok', path }, error: null })),
    exists: jest.fn(async () => ({ data: true, error: null })),
    remove: jest.fn(async (paths: string[]) => ({ data: paths.map((name) => ({ name })), error: null })),
    createSignedUrls: jest.fn(async (paths: string[], expiresIn: number) => ({
      data: paths.map((path) => ({ path, error: null, signedUrl: `https://storage.test/read/${path}?e=${expiresIn}` })),
      error: null,
    })),
  };
  const from = jest.fn(() => bucket);
  (createClient as jest.Mock).mockReturnValue({ storage: { from } });

  const values: Record<string, string> = { DEFAULT_TENANT_ID: 't1', SUPABASE_URL: 'https://project.supabase.test', SUPABASE_SERVICE_ROLE_KEY: 'test-key' };
  const config = { get: (k: string) => values[k] } as never;
  const prisma = {
    visitor: {
      findFirst: jest.fn(async () => ({ photoKey: opts.photoKey ?? null })),
      findUnique: jest.fn(async () => ({ id: 'v1' })),
      updateMany: jest.fn(async () => ({ count: 1 })),
    },
  };
  const row = (visitorId: string, photoKey: string | null) => ({ visitorId, photoKey, firstName: 'Ada', lastName: 'Obi' });
  const pipeline = {
    one: jest.fn(async (id: string) => (opts.onRecord === false ? null : row(id, opts.photoKey ?? null))),
    list: jest.fn(),
  };
  const auth = {
    requireAccess: jest.fn(async () => {
      if (opts.allowed === false) throw new ForbiddenException('Only the follow-up team can see this');
    }),
    firstTimerScope: jest.fn(async () => null),
  };
  const storage = new FirstTimerPhotoStorage(config);
  const urls = new PhotoUrlService(storage, config);
  const service = new FirstTimerPhotosService(prisma as never, pipeline as never, auth as never, storage, urls, config);
  const controller = new FirstTimerPhotosController(service);
  const pipelineController = new FollowUpPipelineController(pipeline as never, auth as never, prisma as never, urls, {} as never);
  return { bucket, from, prisma, pipeline, controller, pipelineController, urls, row };
}

const goodUpload = { contentType: 'image/webp', size: 180_000 };

describe('POST /follow-up/first-timers/:id/photo/upload-url', () => {
  it.each([
    ['a PDF', { ...goodUpload, contentType: 'application/pdf' }],
    ['an SVG', { ...goodUpload, contentType: 'image/svg+xml' }],
    ['a GIF', { ...goodUpload, contentType: 'image/gif' }],
    ['no type', { size: 1000 }],
    ['a photo over 5 MB', { ...goodUpload, size: PHOTO_MAX_BYTES + 1 }],
    ['an empty file', { ...goodUpload, size: 0 }],
  ])('refuses %s, and never signs a link', async (_label, body) => {
    const { controller, bucket } = setup();
    await expect(controller.uploadUrl(actor, 'v1', body)).rejects.toBeInstanceOf(BadRequestException);
    expect(bucket.createSignedUploadUrl).not.toHaveBeenCalled();
  });

  it('accepts exactly 5 MB and signs a one-time link inside this person\'s folder', async () => {
    const { controller, bucket, from } = setup();
    const res = await controller.uploadUrl(actor, 'v1', { ...goodUpload, size: PHOTO_MAX_BYTES });

    expect(from).toHaveBeenCalledWith('first-timer-photos');
    expect(res.key).toMatch(/^t1\/first-timers\/v1\/[0-9a-f-]{36}\.webp$/);
    expect(bucket.createSignedUploadUrl).toHaveBeenCalledWith(res.key);
    expect(res.uploadUrl).toContain('token=tok');
    expect(res.headers).toMatchObject({ 'content-type': 'image/webp', 'x-upsert': 'false' });
  });

  it('names a JPEG fallback .jpg', async () => {
    const { controller } = setup();
    const res = await controller.uploadUrl(actor, 'v1', { ...goodUpload, contentType: 'image/jpeg' });
    expect(res.key).toMatch(/\.jpg$/);
  });

  it('is closed to people outside the follow-up team', async () => {
    const { controller, bucket } = setup({ allowed: false });
    await expect(controller.uploadUrl(actor, 'v1', goodUpload)).rejects.toBeInstanceOf(ForbiddenException);
    expect(bucket.createSignedUploadUrl).not.toHaveBeenCalled();
  });

  it('refuses someone this church does not have on record', async () => {
    const { controller, bucket } = setup({ onRecord: false });
    await expect(controller.uploadUrl(actor, 'v-elsewhere', goodUpload)).rejects.toBeInstanceOf(NotFoundException);
    expect(bucket.createSignedUploadUrl).not.toHaveBeenCalled();
  });
});

describe('POST /follow-up/first-timers/:id/photo', () => {
  it.each([
    ['another tenant', keyOf('v1', UUID, 't2')],
    ['another person', keyOf('v2')],
    ['a path that climbs out', `t1/first-timers/v1/../v2/${UUID}.webp`],
    ['a name it never issues', 't1/first-timers/v1/photo.webp'],
  ])('refuses a key from %s without touching the record', async (_label, key) => {
    const { controller, prisma } = setup();
    await expect(controller.confirm(actor, 'v1', { key })).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.visitor.updateMany).not.toHaveBeenCalled();
  });

  it('refuses a key whose upload never arrived', async () => {
    const { controller, bucket, prisma } = setup();
    bucket.exists.mockResolvedValueOnce({ data: false, error: null });
    await expect(controller.confirm(actor, 'v1', { key: keyOf('v1') })).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.visitor.updateMany).not.toHaveBeenCalled();
  });

  it('saves the photo, then deletes the photo it replaces', async () => {
    const { controller, bucket, prisma } = setup({ photoKey: keyOf('v1', UUID2) });
    const res = await controller.confirm(actor, 'v1', { key: keyOf('v1') });

    const call = (prisma.visitor.updateMany.mock.calls as unknown as [{ where: object; data: Record<string, unknown> }][])[0][0];
    expect(call.where).toEqual({ id: 'v1', tenantId: 't1' });
    expect(call.data).toEqual({ photoKey: keyOf('v1') });
    expect(bucket.remove).toHaveBeenCalledWith([keyOf('v1', UUID2)]);
    expect(res.photoUrl).toContain(keyOf('v1'));
  });

  it('deletes nothing when there was no photo before', async () => {
    const { controller, bucket } = setup({ photoKey: null });
    await controller.confirm(actor, 'v1', { key: keyOf('v1') });
    expect(bucket.remove).not.toHaveBeenCalled();
  });
});

describe('DELETE /follow-up/first-timers/:id/photo', () => {
  it('clears the photo, and deletes the object', async () => {
    const { controller, bucket, prisma } = setup({ photoKey: keyOf('v1') });
    await expect(controller.remove(actor, 'v1')).resolves.toEqual({ removed: true });
    expect(prisma.visitor.updateMany).toHaveBeenCalledWith({
      where: { id: 'v1', tenantId: 't1' },
      data: { photoKey: null, photoConsent: false, photoConsentAt: null },
    });
    expect(bucket.remove).toHaveBeenCalledWith([keyOf('v1')]);
  });
});

describe('read links', () => {
  it('never signs a key from another tenant', async () => {
    const { urls, bucket } = setup();
    const signed = await urls.signMany([keyOf('v1'), keyOf('v9', UUID, 't2'), 'v1/first-timers/x.webp', null]);

    expect(bucket.createSignedUrls).toHaveBeenCalledTimes(1);
    expect(bucket.createSignedUrls).toHaveBeenCalledWith([keyOf('v1')], PHOTO_READ_SECONDS);
    expect([...signed.keys()]).toEqual([keyOf('v1')]);
  });

  it('signs a page in one call, and only keys in each person\'s own folder', async () => {
    const { pipelineController, pipeline, bucket, row } = setup();
    pipeline.list.mockResolvedValue({
      rows: [row('v1', keyOf('v1')), row('v2', keyOf('v1', UUID2)), row('v3', keyOf('v3', UUID, 't2')), row('v4', null)],
      total: 4,
      counts: {},
    });
    const page = await pipelineController.people(actor, {});

    expect(bucket.createSignedUrls).toHaveBeenCalledTimes(1);
    expect(bucket.createSignedUrls).toHaveBeenCalledWith([keyOf('v1')], PHOTO_READ_SECONDS);
    expect(page.rows.map((r) => r.photoUrl)).toEqual([expect.stringContaining(keyOf('v1')), null, null, null]);
  });

  it('still loads the list, with initials, when storage fails', async () => {
    const { pipelineController, pipeline, bucket, row } = setup();
    bucket.createSignedUrls.mockRejectedValueOnce(new Error('storage down'));
    pipeline.list.mockResolvedValue({ rows: [row('v1', keyOf('v1'))], total: 1, counts: {} });
    const page = await pipelineController.people(actor, {});
    expect(page.rows[0].photoUrl).toBeNull();
  });

  it('gives the profile its photo link', async () => {
    const { pipelineController } = setup({ photoKey: keyOf('v1') });
    const res = await pipelineController.person(actor, 'v1');
    expect(res.person.photoUrl).toContain(keyOf('v1'));
  });
});
