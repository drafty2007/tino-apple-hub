import { describe, expect, it } from 'vitest';
import { createProductIdentity } from '../src/lib/product-identity';
describe('Automatic product identity', () => {
  it('gives products with the same name different valid URLs', () => {
    const first = createProductIdentity('iPhone 16 Pro');
    expect(first.slug).toMatch(/^iphone-16-pro-[a-f0-9-]+$/);
    expect(first.slug).not.toBe(createProductIdentity('iPhone 16 Pro').slug);
    expect(first.brand).toBe('Apple');
  });
  it('identifies supported categories without inventing an unknown brand', () => {
    expect(createProductIdentity('S25', 'Samsung Phones').brand).toBe('Samsung');
    expect(createProductIdentity('Pixel 9 Pro').brand).toBe('Google');
    expect(createProductIdentity('9 Pro', 'Google Pixel').brand).toBe('Google');
    expect(createProductIdentity('USB-C cable', 'Accessories').brand).toBe('');
  });
});
