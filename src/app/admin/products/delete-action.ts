'use server';
import { requireAdmin } from '@/lib/auth';
import { assertSameOrigin, rateLimit } from '@/lib/security';
import { database } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
class DeleteError extends Error {}
export type DeleteState = { error?: string; success?: boolean };
const input = z.object({ id: z.string().min(1).max(100), version: z.iso.datetime(), confirmation: z.literal('DELETE') });
export async function deleteProduct(_: DeleteState, form: FormData): Promise<DeleteState> {
  const actor = await requireAdmin(true);
  await assertSameOrigin();
  await rateLimit(`delete-product:${actor.id}`, 30);
  const parsed = input.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: 'Please confirm deletion of this product.' };
  let slug = '';
  try {
    await database().$transaction(async tx => {
      const product = await tx.product.findUnique({ where: { id: parsed.data.id }, include: { variants: { include: { inventory: true } } } });
      if (!product) throw new DeleteError('Product already deleted. Refresh the list.');
      if (product.updatedAt.toISOString() !== parsed.data.version) throw new DeleteError('This product was changed. Refresh the list before deleting.');
      const ids = product.variants.map(v => v.id);
      if (await tx.orderItem.count({ where: { variantId: { in: ids } } })) throw new DeleteError('This product has order history and cannot be deleted. Edit it and uncheck Published to archive it instead.');
      if (product.variants.some(v => (v.inventory?.reserved ?? 0) > 0)) throw new DeleteError('This product has reserved stock and cannot be deleted.');
      await tx.cartItem.deleteMany({ where: { variantId: { in: ids } } });
      await tx.inventory.deleteMany({ where: { variantId: { in: ids } } });
      await tx.productVariant.deleteMany({ where: { productId: product.id } });
      // ProductImage records cascade; stored files are retained for backup/recovery.
      await tx.product.delete({ where: { id: product.id } });
      await tx.auditLog.create({ data: { actorId: actor.id, action: 'PRODUCT_DELETED', entityId: product.id, metadata: { name: product.name, slug: product.slug, skus: product.variants.map(v => v.sku) } } });
      slug = product.slug;
    }, { isolationLevel: 'Serializable' });
  } catch (error) {
    return { error: error instanceof DeleteError ? error.message : 'Could not delete this product. Refresh and try again; linked orders or concurrent changes may prevent deletion.' };
  }
  for (const path of ['/', '/products', `/products/${slug}`, '/admin', '/admin/products', `/admin/products/${parsed.data.id}`]) revalidatePath(path);
  return { success: true };
}
