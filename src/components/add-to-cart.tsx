'use client';
import { useActionState } from 'react';
import Link from 'next/link';
import { updateCart } from '@/app/cart/actions';
export default function AddToCart({ variantId, available }: { variantId: string; available: number }) {
  const [state, action, pending] = useActionState(updateCart, {});
  return <form action={action} className="add-cart-form"><input type="hidden" name="variantId" value={variantId}/><input type="hidden" name="operation" value="add"/><input type="hidden" name="quantity" value="1"/><button className="button" disabled={pending || available < 1}>{pending ? 'Adding…' : available < 1 ? 'Out of stock' : 'Add to cart'}</button>{state.error && <p role="alert" className="error">{state.error}</p>}{state.message && <p role="status" className="cart-feedback">{state.message} <Link href="/cart">View cart →</Link></p>}</form>;
}
