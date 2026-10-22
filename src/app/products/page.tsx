import ProductCollection from '@/components/product-collection';
import Link from 'next/link';
export const dynamic = 'force-dynamic';
export default async function Products({ searchParams }: { searchParams: Promise<{ category?: string | string[] }> }) {
  const { category: query } = await searchParams;
  const category = typeof query === 'string' && /^[a-z0-9-]{1,100}$/.test(query) ? query : undefined;
  const collections = [['', 'All products'], ['iphones', 'iPhones'], ['samsung', 'Samsung Phones'], ['google-pixel', 'Google Pixel'], ['accessories', 'Accessories']];
  const title = collections.find(([slug]) => slug === category)?.[1] ?? 'Our collection';
  return <section className="section"><p className="eyebrow">TINO APPLE HUB</p><h1 style={{ fontSize: 48 }}>{title}</h1><p className="lead">Explore our phones and accessories.</p><nav className="collection-filters" aria-label="Product collections">{collections.map(([slug, name]) => <Link className="secondary-button" key={slug} href={slug ? `/products?category=${slug}` : '/products'} aria-current={(category ?? '') === slug ? 'page' : undefined}>{name}</Link>)}</nav><ProductCollection category={category}/></section>;
}

