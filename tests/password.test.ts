import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword, tokenHash } from '../src/lib/password';
describe('Password and token security', () => {
  it('verifies a password and rejects a different one', async () => {
    const hash = await hashPassword('a-long-test-password');
    expect(await verifyPassword('a-long-test-password', hash)).toBe(true);
    expect(await verifyPassword('incorrect', hash)).toBe(false);
    expect(hash).not.toContain('a-long-test-password');
  });
  it('salts identical passwords independently', async () => {
    expect(await hashPassword('same')).not.toBe(await hashPassword('same'));
  });
  it('rejects malformed hashes', async () => {
    expect(await verifyPassword('password', 'bad')).toBe(false);
  });
  it('hashes session tokens deterministically', () => {
    expect(tokenHash('secret')).toHaveLength(64);
    expect(tokenHash('secret')).not.toBe(tokenHash('other'));
  });
});
