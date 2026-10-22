import 'server-only';
import { headers } from 'next/headers';
import { database } from './db';
import { isAllowedRequestOrigin } from './request-origin';
export async function assertSameOrigin() {
  const origin = (await headers()).get('origin');
  if (!isAllowedRequestOrigin(origin)) throw new Error('Invalid request origin');
}
// Shared PostgreSQL buckets work across server instances. Call inside every sensitive handler.
export async function rateLimit(key: string, limit = 5, windowMs = 900_000) {
  const now = new Date();
  const rows = await database().$queryRaw<{ count: number }[]>`
    INSERT INTO "RateLimit" (key, count, "resetAt") VALUES (${key}, 1, ${new Date(now.getTime() + windowMs)})
    ON CONFLICT (key) DO UPDATE SET
      count = CASE WHEN "RateLimit"."resetAt" <= ${now} THEN 1 ELSE "RateLimit".count + 1 END,
      "resetAt" = CASE WHEN "RateLimit"."resetAt" <= ${now} THEN ${new Date(now.getTime() + windowMs)} ELSE "RateLimit"."resetAt" END
    RETURNING count`;
  if (rows[0].count > limit) throw new Error('Too many attempts. Please try again later.');
}
