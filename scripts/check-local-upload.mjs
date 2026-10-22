// Uses disposable, unpublished fixtures and removes them in finally.
import 'dotenv/config';
import { Client, types } from 'pg';
types.setTypeParser(1114, value => new Date(value + 'Z'));
import { randomUUID, randomBytes, createHash } from 'node:crypto';
import { unlink } from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import sharp from 'sharp';
const origin = 'http://127.0.0.1:3000';
const db = new Client({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 5000 });
const userId = randomUUID(), productId = randomUUID(), sessionId = randomUUID();
const token = randomBytes(32).toString('hex');

try {
  await db.connect();
  await db.query("SET TIME ZONE 'UTC'" );
  const category = (await db.query('SELECT id FROM "Category" LIMIT 1')).rows[0];
  assert(category, 'Seed categories first.');
  await db.query('INSERT INTO "User" (id,email,name,"passwordHash",role) VALUES ($1,$2,$3,$4,$5)', [userId, `upload-check-${userId}@example.invalid`, 'Temporary upload check', randomBytes(64).toString('hex'), 'STAFF']);
  await db.query('INSERT INTO "Session" (id,"tokenHash","userId","expiresAt") VALUES ($1,$2,$3,$4)', [sessionId, createHash('sha256').update(token).digest('hex'), userId, new Date(Date.now() + 300000).toISOString()]);
  const product = (await db.query('INSERT INTO "Product" (id,slug,name,brand,description,"categoryId",archived,"updatedAt") VALUES ($1,$2,$3,$4,$5,$6,true,NOW()) RETURNING "updatedAt"', [productId, `upload-check-${productId}`, 'Temporary upload check', '', 'Unpublished disposable upload fixture', category.id])).rows[0];
  const version = product.updatedAt.toISOString();
  const headers = { Origin: origin, Cookie: `tino_session=${token}; __Host-tino_session=${token}` };
  const body = new FormData();
  // A valid 1x1 PNG, processed by the same decoder as customer product photos.
  const png = await sharp({ create: { width: 2, height: 2, channels: 3, background: '#88aaff' } }).png().toBuffer();
  body.set('file', new Blob([png], { type: 'image/png' }), 'fixture.png'); body.set('productId', productId); body.set('version', version);
  const response = await fetch(`${origin}/api/admin/images`, { method: 'POST', headers, body });
  const result = await response.json();
  assert.equal(response.status, 200, result.error ?? 'Upload failed');
  assert.match(result.image.url, /^\/media\/[a-f0-9-]+\.webp$/);
  const media = await fetch(origin + result.image.url, { headers: { Cookie: headers.Cookie } });
  assert.equal(media.status, 200); assert.equal(media.headers.get('content-type'), 'image/webp');
  assert.equal((await fetch(origin + result.image.url)).status, 404, 'Unpublished photo must be private');
  const anon = await fetch(`${origin}/api/admin/images`, { method: 'POST', headers: { Origin: origin }, body: new FormData() });
  assert.equal(anon.status, 403);
  const invalid = new FormData(); invalid.set('file', new Blob(['not an image'], { type: 'image/jpeg' }), 'bad.jpg'); invalid.set('productId', productId); invalid.set('version', result.version);
  assert.equal((await fetch(`${origin}/api/admin/images`, { method: 'POST', headers, body: invalid })).status, 400);
  const stale = new FormData(); stale.set('file', new Blob([png], { type: 'image/png' }), 'fixture.png'); stale.set('productId', productId); stale.set('version', version);
  assert.equal((await fetch(`${origin}/api/admin/images`, { method: 'POST', headers, body: stale })).status, 409);
  console.log('PASS: authenticated image upload, WebP serving, unpublished image privacy, anonymous rejection, invalid-file rejection, stale-version rejection.');
} finally {
  try {
    // Derive only fixture-owned paths; never delete arbitrary upload paths.
    const images = await db.query('SELECT "publicId" FROM "ProductImage" WHERE "productId"=$1', [productId]);
    for (const row of images.rows) {
      if (/^local:[a-f0-9-]{36}$/.test(row.publicId)) await unlink(path.join(process.cwd(), 'data', 'uploads', `${row.publicId.slice(6)}.webp`)).catch(() => {});
    }
    await db.query('DELETE FROM "ProductImage" WHERE "productId"=$1', [productId]);
    await db.query('DELETE FROM "AuditLog" WHERE "actorId"=$1', [userId]);
    await db.query('DELETE FROM "RateLimit" WHERE key=$1', [`upload:${userId}`]);
    await db.query('DELETE FROM "Product" WHERE id=$1', [productId]);
    await db.query('DELETE FROM "User" WHERE id=$1', [userId]);
  } finally { await db.end(); }
}



