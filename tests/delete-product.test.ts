import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ auth: vi.fn(), origin: vi.fn(), limit: vi.fn(), transaction: vi.fn(), revalidate: vi.fn() }));
vi.mock('@/lib/auth', () => ({ requireAdmin: mocks.auth }));
vi.mock('@/lib/security', () => ({ assertSameOrigin: mocks.origin, rateLimit: mocks.limit }));
vi.mock('@/lib/db', () => ({ database: () => ({ $transaction: mocks.transaction }) }));
vi.mock('next/cache', () => ({ revalidatePath: mocks.revalidate }));
import { deleteProduct } from '../src/app/admin/products/delete-action';
const version = '2026-10-21T12:00:00.000Z';
const form = () => { const f = new FormData(); f.set('id', 'p1'); f.set('version', version); f.set('confirmation', 'DELETE'); return f; };
function transaction({ ordered = false, reserved = 0, stale = false } = {}) {
  return { product: { findUnique: vi.fn().mockResolvedValue({ id: 'p1', name: 'Phone', slug: 'phone', updatedAt: new Date(stale ? '2026-10-22' : version), variants: [{ id: 'v1', sku: 'SKU-1', inventory: { reserved } }] }), delete: vi.fn() }, orderItem: { count: vi.fn().mockResolvedValue(ordered ? 1 : 0) }, cartItem: { deleteMany: vi.fn() }, inventory: { deleteMany: vi.fn() }, productVariant: { deleteMany: vi.fn() }, auditLog: { create: vi.fn() } };
}
beforeEach(() => { vi.resetAllMocks(); mocks.auth.mockResolvedValue({ id: 'owner', role: 'OWNER' }); });
describe('Owner product deletion', () => {
  it('requires owner authorization before accessing data', async () => {
    mocks.auth.mockRejectedValue(new Error('Access denied'));
    await expect(deleteProduct({}, form())).rejects.toThrow('Access denied');
    expect(mocks.auth).toHaveBeenCalledWith(true); expect(mocks.transaction).not.toHaveBeenCalled();
  });
  it('requires explicit confirmation', async () => {
    const f = form(); f.delete('confirmation');
    expect((await deleteProduct({}, f)).error).toContain('confirm'); expect(mocks.transaction).not.toHaveBeenCalled();
  });
  it.each([{ ordered: true }, { reserved: 1 }, { stale: true }])('protects ordered, reserved and changed products: %j', async options => {
    const tx = transaction(options); mocks.transaction.mockImplementation(async fn => fn(tx));
    expect((await deleteProduct({}, form())).error).toBeTruthy(); expect(tx.product.delete).not.toHaveBeenCalled();
    expect(tx.productVariant.deleteMany).not.toHaveBeenCalled();
  });
  it('deletes dependent catalog data and records an audit entry in a transaction', async () => {
    const tx = transaction(); mocks.transaction.mockImplementation(async fn => fn(tx));
    expect(await deleteProduct({}, form())).toEqual({ success: true });
    expect(tx.cartItem.deleteMany).toHaveBeenCalled(); expect(tx.inventory.deleteMany).toHaveBeenCalled();
    expect(tx.productVariant.deleteMany).toHaveBeenCalledWith({ where: { productId: 'p1' } });
    expect(tx.product.delete).toHaveBeenCalledWith({ where: { id: 'p1' } });
    expect(tx.auditLog.create).toHaveBeenCalledWith({ data: expect.objectContaining({ actorId: 'owner', action: 'PRODUCT_DELETED', entityId: 'p1' }) });
    expect(mocks.transaction).toHaveBeenCalledWith(expect.any(Function), { isolationLevel: 'Serializable' });
    expect(mocks.revalidate).toHaveBeenCalledWith('/products/phone');
  });
});
