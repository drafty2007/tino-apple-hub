import AddToCart from "@/components/add-to-cart";
import Image from 'next/image';
import Link from 'next/link';
import { database } from '@/lib/db';
import { formatMoney } from '@/lib/products';
export default async function ProductCollection({ featured = false, category }: { featured?: boolean; category?: string }) {
  if (!process.env.DATABASE_URL) return null;
  const products = await database().product.findMany({ where: { archived: false, demo: false, ...(featured ? { featured: true } : {}), ...(category ? { category: { slug: category } } : {}) }, include: { images: { orderBy: { position: 'asc' }, take: 1 }, variants: { include: { inventory: true } } }, take: featured ? 6 : 100, orderBy: { updatedAt: 'desc' } });
  if (!products.length) return <p className="notice">{category ? 'No products are currently listed in this collection. Please contact us for available options.' : 'Product availability and pricing are being updated. Please contact us for current options.'}</p>;
  return <div className="grid product-grid">{products.map(p => <article className="product-card" key={p.id}><Link href={`/products/${p.slug}`}><div className="product-photo">{p.images[0] ? <Image src={p.images[0].url} alt={p.images[0].alt} width={480} height={400} sizes="(max-width: 700px) 90vw, 30vw" unoptimized={p.images[0].url.startsWith('/media/')}/> : <span>Photo coming soon</span>}</div><div className="product-card-body"><p className="eyebrow">{p.brand}</p><h3>{p.name}</h3><p>{p.variants.length ? `From ${formatMoney(Math.min(...p.variants.map(v => v.discountPrice ?? v.price)))}` : 'Contact for pricing'}</p><small>{p.variants.some(v => v.inventory && v.inventory.quantity > v.inventory.reserved) ? 'In stock' : 'Out of stock'}</small></div></Link><div className="product-card-actions">{p.variants.length === 1 ? <AddToCart variantId={p.variants[0].id} available={Math.max(0, (p.variants[0].inventory?.quantity ?? 0) - (p.variants[0].inventory?.reserved ?? 0))}/> : p.variants.length > 1 ? <Link className="button" href={`/products/${p.slug}`}>Choose options</Link> : null}</div></article>)}</div>;
}

