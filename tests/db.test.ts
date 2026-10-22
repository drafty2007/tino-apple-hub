import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ clients: vi.fn(), adapters: vi.fn(), disconnect: vi.fn().mockResolvedValue(undefined) }));
vi.mock('../src/generated/prisma/client', () => ({ PrismaClient: class { $disconnect = mocks.disconnect; constructor(options: unknown) { mocks.clients(options); } } }));
vi.mock('@prisma/adapter-pg', () => ({ PrismaPg: class { constructor(options: unknown) { mocks.adapters(options); } } }));
import { database } from '../src/lib/db';
const globalDb = globalThis as unknown as { db?: unknown; dbConnectionUrl?: string };
beforeEach(() => { delete globalDb.db; delete globalDb.dbConnectionUrl; vi.clearAllMocks(); });
afterEach(() => { delete globalDb.db; delete globalDb.dbConnectionUrl; vi.unstubAllEnvs(); });
describe('Database pool configuration changes', () => {
  it('refuses a missing database URL', () => {
    vi.stubEnv('DATABASE_URL', ''); expect(() => database()).toThrow('DATABASE_URL is not configured');
    expect(mocks.clients).not.toHaveBeenCalled();
  });
  it('reuses the client for an unchanged URL', () => {
    vi.stubEnv('DATABASE_URL', 'postgresql://example-a');
    expect(database()).toBe(database()); expect(mocks.clients).toHaveBeenCalledTimes(1);
  });
  it('replaces and disconnects the cached client when the URL changes', () => {
    vi.stubEnv('DATABASE_URL', 'postgresql://example-a'); const old = database();
    vi.stubEnv('DATABASE_URL', 'postgresql://example-b'); expect(database()).not.toBe(old);
    expect(mocks.disconnect).toHaveBeenCalledTimes(1); expect(mocks.clients).toHaveBeenCalledTimes(2);
    expect(mocks.adapters).toHaveBeenLastCalledWith({ connectionString: 'postgresql://example-b' });
  });
});
