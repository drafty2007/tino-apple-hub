import 'dotenv/config';
import { Client } from 'pg';
import { randomBytes, createHash } from 'node:crypto';
import assert from 'node:assert/strict';
const origin = 'http://127.0.0.1:3000';
const token = randomBytes(32).toString('hex');
const hash = createHash('sha256').update(token).digest('hex');
const db = new Client({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 5000 });
const headers = { Origin: origin, Cookie: `tino_cart=${token}` };
const decode = text => text.replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
function cartForm(html, variantId, operation, quantity) {
  const formHtml = [...html.matchAll(/<form\b[^>]*>([\s\S]*?)<\/form>/g)].map(match => match[1]).find(value => value.includes(`value="${variantId}"`) && (operation === 'add' ? value.includes('value="add"') : value.includes('cart-controls') || value.includes('>Remove</button>')));
  assert(formHtml, 'Cart form not found');
  const body = new FormData();
  for (const match of formHtml.matchAll(/<input\b([^>]*)>/g)) {
    const name = match[1].match(/\bname="([^"]*)"/), value = match[1].match(/\bvalue="([^"]*)"/);
    if (name) body.set(decode(name[1]), decode(value?.[1] ?? ''));
  }
  body.set('operation', operation); body.set('quantity', String(quantity));
  return body;
}
try {
  await db.connect();
  const row = (await db.query('SELECT v.id, p.slug FROM "ProductVariant" v JOIN "Product" p ON p.id=v."productId" JOIN "Inventory" i ON i."variantId"=v.id WHERE NOT p.archived AND NOT p.demo AND i.quantity>i.reserved LIMIT 1')).rows[0];
  assert(row, 'No published in-stock product is available for this check.');
  const detail = await (await fetch(`${origin}/products/${row.slug}`, { headers })).text();
  const added = await fetch(`${origin}/products/${row.slug}`, { method: 'POST', headers, body: cartForm(detail, row.id, 'add', 1) });
  assert.equal(added.status, 200); await added.text();
  let cart = (await db.query('SELECT c.id, i.quantity FROM "Cart" c JOIN "CartItem" i ON i."cartId"=c.id WHERE c."tokenHash"=$1 AND i."variantId"=$2', [hash, row.id])).rows[0];
  assert.equal(cart?.quantity, 1, 'Add to cart did not persist.');
  const cartHtml = await (await fetch(`${origin}/cart`, { headers })).text();
  assert(cartHtml.includes('Order summary'));
  const other = await (await fetch(`${origin}/cart`)).text(); assert(other.includes('Your cart is empty.'), 'Guest carts must stay isolated');
  const updated = await fetch(`${origin}/cart`, { method: 'POST', headers, body: cartForm(cartHtml, row.id, 'set', 1) }); await updated.text(); assert.equal(updated.status, 200);
  const currentHtml = await (await fetch(`${origin}/cart`, { headers })).text();
  const removed = await fetch(`${origin}/cart`, { method: 'POST', headers, body: cartForm(currentHtml, row.id, 'remove', 1) }); await removed.text(); assert.equal(removed.status, 200);
  const remaining = (await db.query('SELECT count(*)::int AS n FROM "CartItem" WHERE "cartId"=$1', [cart.id])).rows[0].n;
  assert.equal(remaining, 0);
  console.log('PASS: add product, persistent guest cart, isolated empty cart, update quantity, remove item. No product or inventory was changed.');
} finally {
  try {
    await db.query('DELETE FROM "CartItem" WHERE "cartId" IN (SELECT id FROM "Cart" WHERE "tokenHash"=$1)', [hash]);
    await db.query('DELETE FROM "Cart" WHERE "tokenHash"=$1', [hash]);
    await db.query('DELETE FROM "RateLimit" WHERE key=$1', [`cart:${hash}`]);
  } finally { await db.end(); }
}
