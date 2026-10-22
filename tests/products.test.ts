import { describe, expect, it } from 'vitest';
import { moneyInput, productInput } from '../src/lib/products';
const valid = { name: 'Test phone', slug: 'test-phone', brand: 'Test', categoryId: 'category', description: 'A test product description.', specifications: '', featured: false, archived: true, imageIds: [], variants: [{ sku: 'TEST-1', storage: '128GB', color: 'Blue', condition: 'NEW', batteryHealth: '', price: '1999.99', discountPrice: '', quantity: 5 }] };
describe('Product validation', () => {
  it('converts Ghana cedis into integer pesewas', () => { expect(moneyInput.parse('1999.99')).toBe(199999); expect(moneyInput.parse('0.10')).toBe(10); });
  it('rejects negative, fractional pesewa and malformed prices', () => { for (const amount of ['-1', '1.001', 'NaN', '1e3', '']) expect(moneyInput.safeParse(amount).success).toBe(false); });
  it('accepts a product and normalizes optional values', () => { const parsed = productInput.parse(valid); expect(parsed.variants[0].batteryHealth).toBeNull(); expect(parsed.variants[0].discountPrice).toBeNull(); });
  it('allows multiple variants without manual SKUs or specifications', () => {
    const parsed = productInput.parse({ ...valid, specifications: undefined, variants: [{ ...valid.variants[0], sku: undefined }, { ...valid.variants[0], sku: '' }] });
    expect(parsed.specifications).toBe('');
    expect(parsed.variants.map(v => v.sku)).toEqual(['', '']);
  });
  it('rejects discount above price', () => { expect(productInput.safeParse({ ...valid, variants: [{ ...valid.variants[0], discountPrice: '2500' }] }).success).toBe(false); });
  it('rejects duplicate SKUs', () => { expect(productInput.safeParse({ ...valid, variants: [valid.variants[0], valid.variants[0]] }).success).toBe(false); });
  it('rejects negative stock and invalid battery health', () => { for (const changes of [{ quantity: -1 }, { batteryHealth: '101' }]) expect(productInput.safeParse({ ...valid, variants: [{ ...valid.variants[0], ...changes }] }).success).toBe(false); });
});
