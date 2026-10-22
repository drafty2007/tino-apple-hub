import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ origin: vi.fn(), limit: vi.fn(), transaction: vi.fn(), revalidate: vi.fn(), getCookie: vi.fn(), setCookie: vi.fn() }));
vi.mock('@/lib/cart', () => ({ cartCookieName: 'tino_cart' }));
vi.mock('next/headers', () => ({ cookies: async () => ({ get: mocks.getCookie, set: mocks.setCookie }) }));
vi.mock('@/lib/security', () => ({ assertSameOrigin: mocks.origin, rateLimit: mocks.limit }));
vi.mock('@/lib/db', () => ({ database: () => ({ $transaction: mocks.transaction }) }));
vi.mock('next/cache', () => ({ revalidatePath: mocks.revalidate }));
import { updateCart } from '../src/app/cart/actions';
const form = (operation = 'add', quantity = '1') => { const f = new FormData(); f.set('variantId', 'v1'); f.set('operation', operation); f.set('quantity', quantity); return f; };
function transaction({ quantity = 0, stock = 5, archived = false } = {}) {
  return { cart: { findUnique: vi.fn().mockResolvedValue({ id: 'c1', expiresAt: new Date(Date.now() + 100000) }), update: vi.fn() }, $queryRaw: vi.fn(), productVariant: { findUnique: vi.fn().mockResolvedValue({ price: 10000, discountPrice: null, inventory: { quantity: stock, reserved: 0 }, product: { archived, demo: false } }) }, cartItem: { findUnique: vi.fn().mockResolvedValue(quantity ? { quantity } : null), count: vi.fn().mockResolvedValue(1), upsert: vi.fn(), deleteMany: vi.fn() } };
}
beforeEach(() => { vi.resetAllMocks(); mocks.getCookie.mockReturnValue({ value: 'a'.repeat(64) }); });
describe('Server cart mutations', () => {
  it('rejects cross-origin writes before opening a transaction', async () => {
    mocks.origin.mockRejectedValue(new Error('Invalid request origin'));
    await expect(updateCart({}, form())).rejects.toThrow('Invalid request origin'); expect(mocks.transaction).not.toHaveBeenCalled();
  });
  it('rejects malformed quantities', async () => {
    for (const quantity of ['-1', '0', '1.5', '101']) expect((await updateCart({}, form('add', quantity))).error).toBeTruthy();
    expect(mocks.transaction).not.toHaveBeenCalled();
  });
  it('adds to existing quantity and stores only quantity and variant identity', async () => {
    const tx = transaction({ quantity: 2 }); mocks.transaction.mockImplementation(async fn => fn(tx));
    const f = form(); f.set('price', '1');
    expect((await updateCart({}, f)).message).toContain('Added');
    expect(tx.cartItem.upsert).toHaveBeenCalledWith(expect.objectContaining({ update: { quantity: 3 }, create: { cartId: 'c1', variantId: 'v1', quantity: 3 } }));
    expect(mocks.setCookie).toHaveBeenCalledWith('tino_cart', expect.any(String), expect.objectContaining({ httpOnly: true, sameSite: 'lax' }));
  });
  it.each([{ stock: 0 }, { quantity: 5 }, { archived: true }])('blocks unavailable stock or archived products: %j', async options => {
    const tx = transaction(options); mocks.transaction.mockImplementation(async fn => fn(tx));
    expect((await updateCart({}, form())).error).toBeTruthy(); expect(tx.cartItem.upsert).not.toHaveBeenCalled();
  });
  it('can remove an item even if its quantity input was cleared', async () => {
    const tx = transaction(); mocks.transaction.mockImplementation(async fn => fn(tx));
    expect((await updateCart({}, form('remove', ''))).message).toContain('removed');
    expect(tx.cartItem.deleteMany).toHaveBeenCalledWith({ where: { cartId: 'c1', variantId: 'v1' } });
  });
});
