import AddToCart from "@/components/add-to-cart";
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { database } from '@/lib/db';
import { formatMoney } from '@/lib/products';
import { whatsappLink } from '@/lib/store-contact';
export const dynamic = 'force-dynamic';
export default async function ProductDetail({ params }: { params: Promise<{ slug: string }> }) {
  if (!process.env.DATABASE_URL) notFound();
  const { slug } = await params;
  const p = await database().product.findFirst({ where: { slug, archived: false, demo: false }, include: { images: { orderBy: { position: 'asc' } }, variants: { include: { inventory: true }, orderBy: { price: 'asc' } } } });
  if (!p) notFound();
  const specs = p.specifications as { details?: string };
  return <section className="section"><p className="eyebrow">{p.brand}</p><h1 style={{ fontSize: 48 }}>{p.name}</h1><div className="detail-grid"><div>{p.images.map(i => <Image key={i.id} src={i.url} alt={i.alt} unoptimized={i.url.startsWith("/media/")} width={700} height={600} sizes="(max-width: 700px) 90vw, 45vw" style={{ width: '100%', height: 'auto', objectFit: 'contain' }}/>)}</div><div><p className="product-description">{p.description}</p>{specs.details && <><h2>Specifications</h2><p className="product-description">{specs.details}</p></>}<h2>Available options</h2>{p.variants.map(v => { const stock = Math.max(0, (v.inventory?.quantity ?? 0) - (v.inventory?.reserved ?? 0)); return <article className="admin-panel" key={v.id}><h3>{[v.storage, v.color, v.condition.replaceAll('_', ' ')].filter(Boolean).join(' · ')}</h3><p><strong>{formatMoney(v.discountPrice ?? v.price)}</strong>{v.discountPrice !== null && <del style={{ marginLeft: 12 }}>{formatMoney(v.price)}</del>}</p>{v.batteryHealth !== null && <p>Battery health: {v.batteryHealth}%</p>}<p>{stock ? 'In stock' : 'Out of stock'} · SKU: {v.sku}</p><AddToCart variantId={v.id} available={stock}/><a className="button button-whatsapp" href={whatsappLink(`Hello TINO APPLE HUB, I am interested in ${p.name}, ${v.storage ?? ''}, ${v.color}, ${v.condition.replaceAll('_', ' ')}. SKU: ${v.sku}. Listed price: ${formatMoney(v.discountPrice ?? v.price)}. Please confirm availability.`)} target="_blank" rel="noopener noreferrer">Enquire on WhatsApp</a></article>; })}</div></div></section>;
}


