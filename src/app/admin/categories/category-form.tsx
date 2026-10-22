'use client';
import { useActionState } from 'react';
import { createCategory } from '../products/actions';
export default function CategoryForm() {
  const [state, action, pending] = useActionState(createCategory, {});
  return <form action={action} className="admin-form admin-panel"><h2>Add category</h2>{state.error && <p role="status" className="form-alert">{state.error}</p>}<div className="form-grid"><label>Name<input name="name" required minLength={2} maxLength={80}/></label><label>URL slug<input name="slug" placeholder="accessories" required maxLength={100} pattern="[a-z0-9]+(-[a-z0-9]+)*"/></label></div><button className="button" disabled={pending}>{pending ? 'Creating…' : 'Create category'}</button></form>;
}
