'use server';
import { cookies } from 'next/headers';
import { randomBytes } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { database } from '@/lib/db';
import { tokenHash } from '@/lib/password';
import { cartCookieName } from '@/lib/cart';
import { assertSameOrigin, rateLimit } from '@/lib/security';
import { cartLineState } from '@/lib/cart-totals';
export type CartState = { error?: string; message?: string };
class CartError extends Error {}
const input = z.object({ variantId: z.string().min(1).max(100), quantity: z.coerce.number().int().min(1).max(100).default(1), operation: z.enum(['add', 'set', 'remove']) });
export async function updateCart(_: CartState, form: FormData): Promise<CartState> {
  await assertSameOrigin();
  const raw = Object.fromEntries(form);
  if (raw.operation === 'remove') raw.quantity = '1';
  const parsed = input.safeParse(raw);
  if (!parsed.success) return { error: 'Choose a valid product and a quantity between 1 and 100.' };
  const { variantId, quantity, operation } = parsed.data;
  const jar = await cookies();
  const existing = jar.get(cartCookieName)?.value;
  let token = existing && /^[a-f0-9]{64}$/.test(existing) ? existing : randomBytes(32).toString('hex');
  await rateLimit(`cart:${tokenHash(token)}`, 120);
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  try {
    await database().$transaction(async tx => {
      let cart = await tx.cart.findUnique({ where: { tokenHash: tokenHash(token) } });
      if (cart && cart.expiresAt <= new Date()) { cart = null; token = randomBytes(32).toString('hex'); }
      if (!cart) {
        if (operation !== 'add') throw new CartError('Your cart has expired. Add the product again.');
        cart = await tx.cart.create({ data: { tokenHash: tokenHash(token), expiresAt } });
      }
      await tx.$queryRaw`SELECT id FROM "Cart" WHERE id = ${cart.id} FOR UPDATE`;
      if (operation === 'remove') { await tx.cartItem.deleteMany({ where: { cartId: cart.id, variantId } }); return; }
      const variant = await tx.productVariant.findUnique({ where: { id: variantId }, include: { inventory: true, product: true } });
      if (!variant || variant.product.archived || variant.product.demo) throw new CartError('This product is no longer available.');
      const item = await tx.cartItem.findUnique({ where: { cartId_variantId: { cartId: cart.id, variantId } } });
      if (operation === 'set' && !item) throw new CartError('This item is no longer in your cart.');
      if (!item && await tx.cartItem.count({ where: { cartId: cart.id } }) >= 50) throw new CartError('Your cart can contain up to 50 different options.');
      const nextQuantity = operation === 'add' ? (item?.quantity ?? 0) + quantity : quantity;
      const state = cartLineState(variant, nextQuantity);
      if (!state.valid) throw new CartError(state.available ? `Only ${Math.min(state.available, 100)} units can be added for this option.` : 'This option is out of stock.');
      await tx.cartItem.upsert({ where: { cartId_variantId: { cartId: cart.id, variantId } }, create: { cartId: cart.id, variantId, quantity: nextQuantity }, update: { quantity: nextQuantity } });
      await tx.cart.update({ where: { id: cart.id }, data: { expiresAt } });
    }, { isolationLevel: 'Serializable' });
  } catch (error) { return { error: error instanceof CartError ? error.message : 'Your cart could not be updated. Please try again.' }; }
  jar.set(cartCookieName, token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', expires: expiresAt });
  revalidatePath('/cart'); revalidatePath('/', 'layout');
  return { message: operation === 'remove' ? 'Item removed.' : operation === 'set' ? 'Quantity updated.' : 'Added to your cart.' };
}
