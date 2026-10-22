import 'server-only';
import { cookies } from 'next/headers';
import { database } from './db';
import { tokenHash } from './password';
export const cartCookieName = process.env.NODE_ENV === 'production' ? '__Host-tino_cart' : 'tino_cart';
export async function getCart() {
  const token = (await cookies()).get(cartCookieName)?.value;
  if (!token || !/^[a-f0-9]{64}$/.test(token) || !process.env.DATABASE_URL) return null;
  return database().cart.findFirst({ where: { tokenHash: tokenHash(token), expiresAt: { gt: new Date() } }, include: { items: { include: { variant: { include: { inventory: true, product: { include: { images: { orderBy: { position: 'asc' }, take: 1 } } } } } }, orderBy: { variantId: 'asc' } } } });
}
