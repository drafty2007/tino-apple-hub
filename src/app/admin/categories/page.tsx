import { requireAdmin } from '@/lib/auth';
import { database } from '@/lib/db';
import CategoryForm from './category-form';
export default async function Categories() {
  await requireAdmin();
  const categories = await database().category.findMany({ include: { _count: { select: { products: true } } }, orderBy: { name: 'asc' } });
  return <><div className="admin-heading"><div><p className="eyebrow">Catalog</p><h1>Categories</h1><p>Organise your phones and accessories.</p></div></div><div className="table-wrap"><table><thead><tr><th>Name</th><th>URL slug</th><th>Products</th></tr></thead><tbody>{categories.map(c => <tr key={c.id}><td>{c.name}</td><td>{c.slug}</td><td>{c._count.products}</td></tr>)}</tbody></table></div><CategoryForm/></>;
}
