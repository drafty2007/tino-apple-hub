import { describe, expect, it } from 'vitest';
import { cartLineState } from '../src/lib/cart-totals';
const variant = { price: 199999, discountPrice: null, inventory: { quantity: 5, reserved: 2 }, product: { archived: false, demo: false } };
describe('Cart pricing and availability', () => {
  it('uses integer pesewas and server prices for line totals', () => {
    expect(cartLineState(variant, 2)).toEqual({ available: 3, unitPrice: 199999, lineTotal: 399998, valid: true });
  });
  it('uses the current discount, including a zero price', () => {
    expect(cartLineState({ ...variant, discountPrice: 150000 }, 2).lineTotal).toBe(300000);
    expect(cartLineState({ ...variant, discountPrice: 0 }, 1).unitPrice).toBe(0);
  });
  it('does not sell stock reserved for another order', () => {
    expect(cartLineState(variant, 4).valid).toBe(false);
    expect(cartLineState({ ...variant, inventory: null }, 1).valid).toBe(false);
  });
  it('rejects archived and demo products', () => {
    expect(cartLineState({ ...variant, product: { archived: true, demo: false } }, 1).valid).toBe(false);
    expect(cartLineState({ ...variant, product: { archived: false, demo: true } }, 1).valid).toBe(false);
  });
});
