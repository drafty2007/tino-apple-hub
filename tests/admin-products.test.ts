import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ auth: vi.fn(), origin: vi.fn(), limit: vi.fn(), transaction: vi.fn(), redirect: vi.fn(), revalidate: vi.fn() }));
vi.mock('@/lib/auth', () => ({ requireAdmin: mocks.auth }));
vi.mock('@/lib/security', () => ({ assertSameOrigin: mocks.origin, rateLimit: mocks.limit }));
vi.mock('@/lib/db', () => ({ database: () => ({ $transaction: mocks.transaction }) }));
vi.mock('next/navigation', () => ({ redirect: mocks.redirect }));
vi.mock('next/cache', () => ({ revalidatePath: mocks.revalidate }));
import { saveProduct } from '../src/app/admin/products/actions';
const valid = { name: 'Test phone', slug: 'test-phone', brand: 'Test', categoryId: 'category', description: 'A test product description.', specifications: '', featured: false, archived: true, imageIds: [], variants: [{ sku: 'TEST-1', storage: '128GB', color: 'Blue', condition: 'NEW', batteryHealth: '', price: '1999.99', discountPrice: '', quantity: 5 }] };
const form = (value: unknown) => { const data = new FormData(); data.set('payload', JSON.stringify(value)); return data; };
beforeEach(() => { vi.resetAllMocks(); mocks.auth.mockResolvedValue({ id: 'owner', role: 'OWNER' }); });
describe('Admin product server action', () => {
  it('requires authorization before any mutation', async () => {
    mocks.auth.mockRejectedValue(new Error('Access denied'));
    await expect(saveProduct({}, form(valid))).rejects.toThrow('Access denied');
    expect(mocks.transaction).not.toHaveBeenCalled();
  });
  it('rejects a cross-origin request before touching the database', async () => {
    mocks.origin.mockRejectedValue(new Error('Invalid request origin'));
    await expect(saveProduct({}, form(valid))).rejects.toThrow('Invalid request origin');
    expect(mocks.transaction).not.toHaveBeenCalled();
  });
  it('rejects malformed product input before opening a transaction', async () => {
    expect((await saveProduct({}, form({ ...valid, variants: [] }))).error).toBeTruthy();
    expect(mocks.transaction).not.toHaveBeenCalled();
  });
  it('rejects a stale editor without updating anything', async () => {
    const update = vi.fn();
    mocks.transaction.mockImplementation(async fn => fn({ product: { findUnique: async () => ({ updatedAt: new Date('2026-01-01') }), update } }));
    expect((await saveProduct({}, form({ ...valid, id: 'p1', version: 'old' }))).error).toContain('another session');
    expect(update).not.toHaveBeenCalled();
  });
  it('creates inventory and audit history in the same serializable transaction', async () => {
    const createProduct = vi.fn().mockResolvedValue({ id: 'p1', name: 'Test phone', updatedAt: new Date('2026-10-21T12:00:00Z') });
    const createVariant = vi.fn().mockResolvedValue({ id: 'v1' });
    const createStock = vi.fn(); const audit = vi.fn();
    mocks.transaction.mockImplementation(async fn => fn({ category: { findUnique: async () => ({ id: 'category' }) }, productImage: { findMany: async () => [], deleteMany: vi.fn() }, product: { create: createProduct }, productVariant: { create: createVariant }, inventory: { create: createStock }, auditLog: { create: audit } }));
    mocks.redirect.mockImplementation(() => { throw new Error('NEXT_REDIRECT'); });
    const { slug: _slug, brand: _brand, ...withoutIdentity } = valid;
    void _slug; void _brand;
    await expect(saveProduct({}, form(withoutIdentity))).rejects.toThrow('NEXT_REDIRECT');
    expect(createProduct).toHaveBeenCalledWith({ data: expect.objectContaining({ slug: expect.stringMatching(/^test-phone-[a-f0-9-]+$/), brand: '' }) });
    expect(createVariant).toHaveBeenCalledWith({ data: expect.objectContaining({ price: 199999, productId: 'p1' }) });
    expect(createStock).toHaveBeenCalledWith({ data: { variantId: 'v1', quantity: 5 } });
    expect(audit).toHaveBeenCalledWith({ data: expect.objectContaining({ actorId: 'owner', action: 'PRODUCT_CREATED' }) });
    expect(mocks.transaction).toHaveBeenCalledWith(expect.any(Function), { isolationLevel: 'Serializable' });
    expect(mocks.redirect).toHaveBeenCalledWith('/admin/products/p1?saved=1');
    const withPhotos = form(withoutIdentity);
    withPhotos.set('uploadAfterSave', 'true');
    expect(await saveProduct({}, withPhotos)).toEqual({ productId: 'p1', version: '2026-10-21T12:00:00.000Z', variantIds: { 'TEST-1': 'v1' } });
  });
  it('generates unique SKUs and keeps separate variant IDs for photo-upload retries', async () => {
    const createVariant = vi.fn().mockResolvedValueOnce({ id: 'v1' }).mockResolvedValueOnce({ id: 'v2' });
    mocks.transaction.mockImplementation(async fn => fn({ category: { findUnique: async () => ({ id: 'category' }) }, productImage: { findMany: async () => [], deleteMany: vi.fn() }, product: { create: async () => ({ id: 'p1', name: 'Test phone', updatedAt: new Date('2026-10-21T12:00:00Z') }) }, productVariant: { create: createVariant }, inventory: { create: vi.fn() }, auditLog: { create: vi.fn() } }));
    const payload = { ...valid, specifications: undefined, variants: [{ ...valid.variants[0], sku: '' }, { ...valid.variants[0], sku: '' }] };
    const f = form(payload); f.set('uploadAfterSave', 'true');
    expect((await saveProduct({}, f)).variantIds).toEqual({ 'index:0': 'v1', 'index:1': 'v2' });
    const skus = createVariant.mock.calls.map(([args]) => args.data.sku);
    expect(skus[0]).toMatch(/^TINO-[a-f0-9-]+$/); expect(skus[0]).not.toBe(skus[1]);
  });
});
