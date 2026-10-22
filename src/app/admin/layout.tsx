import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { logout } from '../login/actions';
export const dynamic = 'force-dynamic';
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!process.env.DATABASE_URL) return <section className="section admin-setup"><p className="eyebrow">Private store administration</p><h1>Connect your store.</h1><p>Your admin dashboard needs PostgreSQL and an owner account before you can sign in and add products.</p><ol><li>Configure <code>DATABASE_URL</code> and <code>APP_URL</code> in your local <code>.env</code>.</li><li>Run <code>pnpm db:deploy</code> and <code>pnpm db:seed</code>.</li><li>Set private <code>OWNER_EMAIL</code> and a unique <code>OWNER_PASSWORD</code>, then run <code>pnpm owner:create</code>.</li><li>Remove the password environment variable and sign in.</li></ol><p className="notice">No default admin account exists. Never share passwords or database credentials in chat.</p><Link className="button" href="/login">Go to sign in</Link></section>;
  const user = await requireAdmin();
  return <div className="admin-shell"><aside className="admin-sidebar"><p className="eyebrow">Store manager</p><strong>TINO APPLE HUB</strong><nav aria-label="Admin navigation"><Link href="/admin">Overview</Link><Link href="/admin/products">Products</Link><Link href="/admin/categories">Categories</Link><Link href="/">View storefront ↗</Link></nav><div className="admin-identity"><strong>{user.name}</strong><small>{user.role.toLowerCase()}</small><form action={logout}><button className="secondary-button">Sign out</button></form></div></aside><div className="admin-content">{children}</div></div>;
}
