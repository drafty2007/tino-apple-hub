import { describe, expect, it } from 'vitest';
import { isAllowedRequestOrigin } from '../src/lib/request-origin';
import { createPhotoId } from '../src/lib/photo-id';
const env = { NODE_ENV: 'development' as const, APP_URL: 'http://127.0.0.1:3000', DEV_ALLOWED_ORIGINS: 'http://172.20.10.2:3000' };
describe('Local phone access', () => {
  it('accepts configured desktop and phone origins', () => {
    expect(isAllowedRequestOrigin(env.APP_URL, env)).toBe(true);
    expect(isAllowedRequestOrigin('http://172.20.10.2:3000', env)).toBe(true);
  });
  it('rejects other origins, ports and missing origins', () => {
    for (const origin of [null, 'https://example.com', 'http://172.20.10.2:4000']) expect(isAllowedRequestOrigin(origin, env)).toBe(false);
  });
  it('does not permit development origins in production', () => {
    expect(isAllowedRequestOrigin('http://172.20.10.2:3000', { ...env, NODE_ENV: 'production' })).toBe(false);
  });
  it('creates unique photo preview IDs without requiring randomUUID', () => {
    expect(createPhotoId()).toMatch(/^[a-f0-9]{32}$/);
    expect(createPhotoId()).not.toBe(createPhotoId());
  });
});
