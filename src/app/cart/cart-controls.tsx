'use client';
import { useActionState } from 'react';
import { updateCart } from './actions';
export default function CartControls({ variantId, quantity, available }: { variantId: string; quantity: number; available: number }) {
  const [state, action, pending] = useActionState(updateCart, {});
  return <form action={action} className="cart-controls"><input type="hidden" name="variantId" value={variantId}/><label>Quantity<input name="quantity" type="number" min="1" max={Math.max(quantity, Math.min(100, available))} defaultValue={quantity} required/></label><button className="secondary-button" name="operation" value="set" disabled={pending || available < 1}>Update</button><button className="delete-button" name="operation" value="remove" disabled={pending} formNoValidate>Remove</button>{pending && <span role="status">Updating…</span>}{state.error && <p role="alert" className="error">{state.error}</p>}</form>;
}
