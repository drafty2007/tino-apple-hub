'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { assertSameOrigin, rateLimit } from '@/lib/security';
import { database } from '@/lib/db';
import { productInput } from '@/lib/products';
import { Prisma } from '@/generated/prisma/client';
import { createProductIdentity } from '@/lib/product-identity';
import { randomUUID } from 'node:crypto';
class ProductSaveError extends Error {}
export type SaveState = { error?: string; productId?: string; version?: string; variantIds?: Record<string, string> };
export async function saveProduct(_: SaveState, form: FormData): Promise<SaveState> {
  const actor = await requireAdmin();
  await assertSameOrigin();
  await rateLimit(`product:${actor.id}`, 120);
  let raw;
  try { raw = JSON.parse(String(form.get('payload'))); } catch { return { error: 'Invalid product form. Please reload and try again.' }; }
  const parsed = productInput.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(' • ') };
  const data = parsed.data;
  let savedId = '';
  let savedVersion = '';
  const variantIds: Record<string, string> = {};
  try {
    savedId = await database().$transaction(async tx => {
      const old = data.id ? await tx.product.findUnique({ where: { id: data.id }, include: { variants: { include: { inventory: true } }, images: true } }) : null;
      if (data.id && (!old || old.updatedAt.toISOString() !== data.version)) throw new ProductSaveError('This product changed in another session. Reload before saving.');
      const category = await tx.category.findUnique({ where: { id: data.categoryId } });
      if (!category) throw new ProductSaveError('Choose a valid category.');
      if (old?.variants.some(v => !data.variants.some(x => x.id === v.id))) throw new ProductSaveError('Existing variants must be kept to preserve order history. Set their stock to zero instead.');
      if (data.variants.some(v => v.id && !old?.variants.some(x => x.id === v.id))) throw new ProductSaveError('Invalid variant reference.');
      // Images are linked by server-recorded IDs, never arbitrary browser-supplied URLs.
      const images = await tx.productImage.findMany({ where: { id: { in: data.imageIds }, productId: data.id ?? '' } });
      if (images.length !== data.imageIds.length) throw new ProductSaveError('An image no longer exists. Reload the editor.');
      const identity = old ? { slug: data.slug || old.slug, brand: data.brand || old.brand } : createProductIdentity(data.name, category.name);
      const fields = { name: data.name, ...identity, description: data.description, specifications: { details: data.specifications }, categoryId: data.categoryId, featured: data.featured, archived: data.archived, demo: false };
      const product = old ? await tx.product.update({ where: { id: old.id }, data: fields }) : await tx.product.create({ data: fields });
      savedVersion = product.updatedAt?.toISOString() ?? '';
      for (const [index, v] of data.variants.entries()) {
        const { id, quantity, ...values } = v;
        values.sku = old?.variants.find(existing => existing.id === id)?.sku || v.sku || `TINO-${randomUUID()}`;
        const saved = id ? await tx.productVariant.update({ where: { id }, data: values }) : await tx.productVariant.create({ data: { ...values, productId: product.id } });
        variantIds[v.sku || `index:${index}`] = saved.id;
        if (id) {
          const result = await tx.inventory.updateMany({ where: { variantId: id, reserved: { lte: quantity } }, data: { quantity } });
          if (result.count !== 1) throw new ProductSaveError('Stock cannot be below the units reserved for orders. Reload and try again.');
        } else await tx.inventory.create({ data: { variantId: saved.id, quantity } });
      }
      await tx.productImage.deleteMany({ where: { productId: product.id, id: { notIn: data.imageIds } } });
      await tx.auditLog.create({ data: { actorId: actor.id, action: old ? 'PRODUCT_UPDATED' : 'PRODUCT_CREATED', entityId: product.id, metadata: { name: product.name } } });
      return product.id;
    }, { isolationLevel: 'Serializable' });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return { error: error.code === 'P2002' ? 'That SKU or product URL already exists. Choose a unique value.' : error.code === 'P2034' ? 'Another update happened at the same time. Reload and try again.' : 'Unable to save. Please reload and check your entries.' };
    }
    return { error: error instanceof ProductSaveError ? error.message : 'Unable to save product.' };
  }
  revalidatePath('/'); revalidatePath('/products'); revalidatePath('/admin'); revalidatePath('/admin/products');
  if (form.get('uploadAfterSave') === 'true') return { productId: savedId, version: savedVersion, variantIds };
  redirect(`/admin/products/${savedId}?saved=1`);
}
export async function createCategory(_: SaveState, form: FormData): Promise<SaveState> {
  const actor = await requireAdmin(); await assertSameOrigin();
  await rateLimit(`categories:${actor.id}`, 30);
  const name = String(form.get('name') ?? '').trim();
  const slug = String(form.get('slug') ?? '').trim();
  if (name.length < 2 || name.length > 80 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 100) return { error: 'Enter a name and a lowercase URL slug, such as samsung-phones.' };
  try {
    await database().$transaction(async tx => {
      const category = await tx.category.create({ data: { name, slug } });
      await tx.auditLog.create({ data: { actorId: actor.id, action: 'CATEGORY_CREATED', entityId: category.id } });
    });
  } catch { return { error: 'Could not create category. The URL slug may already be in use.' }; }
  revalidatePath('/admin/products'); revalidatePath('/admin/categories');
  return { error: 'Category created successfully.' };
}

