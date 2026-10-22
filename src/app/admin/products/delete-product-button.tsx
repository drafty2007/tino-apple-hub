'use client';
import { useActionState, useState } from 'react';
import { deleteProduct } from './delete-action';
export default function DeleteProductButton({ id, name, version }: { id: string; name: string; version: string }) {
  const [confirming, setConfirming] = useState(false);
  const [state, action, pending] = useActionState(deleteProduct, {});
  if (state.success) return <span role="status">Product deleted.</span>;
  return <div className="delete-product-control">{!confirming ? <button type="button" className="delete-button" onClick={() => setConfirming(true)}>Delete</button> : <form action={action} className="delete-confirmation" aria-label={`Confirm deletion of ${name}`}><p>Delete <strong>{name}</strong> permanently? This removes its variants and listing. This cannot be undone here.</p><input type="hidden" name="id" value={id}/><input type="hidden" name="version" value={version}/><input type="hidden" name="confirmation" value="DELETE"/><div className="delete-actions"><button className="delete-button delete-confirm" type="submit" disabled={pending}>{pending ? 'Deleting…' : 'Confirm delete'}</button><button className="secondary-button" type="button" disabled={pending} onClick={() => setConfirming(false)}>Cancel</button></div></form>}{state.error && <p className="error delete-error" role="alert">{state.error}</p>}</div>;
}
