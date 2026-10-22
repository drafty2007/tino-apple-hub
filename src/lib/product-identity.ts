import { randomUUID } from 'node:crypto';

export function createProductIdentity(name: string, categoryName = '') {
  const base = name.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 150).replace(/-$/, '') || 'product';
  const brand = /\b(apple|iphone|ipad|airpods|macbook)\b/i.test(name) || /^iphones$/i.test(categoryName)
    ? 'Apple'
    : /\b(samsung|galaxy)\b/i.test(name) || /^samsung(?: phones)?$/i.test(categoryName) ? 'Samsung'
    : /\bpixel\b/i.test(name) || /^google pixel(?: phones)?$/i.test(categoryName) ? 'Google' : '';
  return { slug: `${base}-${randomUUID()}`, brand };
}
