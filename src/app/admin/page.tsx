import Link from "next/link";
import { requireAdmin } from '@/lib/auth';
import { database } from '@/lib/db';
import { logout } from '../login/actions';
export const dynamic = 'force-dynamic';
export default async function Admin() {
  if (!process.env.DATABASE_URL) return null;
  const user = await requireAdmin();
  const db = database();
  const [products, orders, customers, revenue] = await Promise.all([db.product.count({ where: { archived: false } }), db.order.count(), db.user.count({ where: { role: 'CUSTOMER' } }), db.order.aggregate({ where: { paymentStatus: 'PAID' }, _sum: { total: true } })]);
  return <section><p className="eyebrow">Store administration · {user.role}</p><h1 style={{fontSize:48}}>Hello, {user.name}.</h1><div className="grid">{[['Products', products], ['Orders', orders], ['Customers', customers], ['Verified revenue', new Intl.NumberFormat('en-GH', {style:'currency',currency:'GHS'}).format((revenue._sum.total ?? 0)/100)]].map(([label,value])=><article className="tile" key={label}><p>{label}</p><h2>{value}</h2></article>)}</div><div className="admin-panel"><h2>Manage your collection</h2><p>Add products, upload photos, update prices and track your stock.</p><Link className="button" href="/admin/products/new">+ Add product</Link> <Link className="secondary-button" href="/admin/products">View products</Link></div><form action={logout}><button className="button">Sign out</button></form></section>;
}

