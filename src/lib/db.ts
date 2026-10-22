import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
const globalDb = globalThis as unknown as { db?: PrismaClient; dbConnectionUrl?: string };
export function database() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL is not configured.');
  // Next.js reloads .env during development while globalThis survives module reloads.
  // Replace a pool created with an older URL rather than keeping stale credentials.
  if (!globalDb.db || globalDb.dbConnectionUrl !== connectionString) {
    if (globalDb.db) void globalDb.db.$disconnect().catch(() => {});
    globalDb.db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
    globalDb.dbConnectionUrl = connectionString;
  }
  return globalDb.db;
}
