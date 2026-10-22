import Link from 'next/link';
import { getCart } from '@/lib/cart';
export default async function CartLink() {
  const cart = await getCart();
  const count = cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
  return <Link href="/cart">Cart{count > 0 ? ` (${count})` : ''}</Link>;
}
