import Image from 'next/image';
import Link from 'next/link';
import { getCart } from '@/lib/cart';
import { cartLineState } from '@/lib/cart-totals';
import { formatMoney } from '@/lib/products';
import { whatsappLink } from '@/lib/store-contact';
import CartControls from './cart-controls';
export const dynamic = 'force-dynamic';
export default async function CartPage() {
  const cart = await getCart();
  const items = cart?.items ?? [];
  const lines = items.map(item => ({ ...item, ...cartLineState(item.variant, item.quantity) }));
  const subtotal = lines.filter(line => line.valid).reduce((sum, line) => sum + line.lineTotal, 0);
  const message = ['Hello TINO APPLE HUB, I would like to order:', ...lines.filter(line => line.valid).map(line => `${line.quantity} × ${line.variant.product.name} (${[line.variant.storage, line.variant.color, line.variant.condition.replaceAll('_', ' ')].filter(Boolean).join(', ')}) — ${formatMoney(line.lineTotal)}; SKU: ${line.variant.sku}`), `Product subtotal: ${formatMoney(subtotal)}. Please confirm stock, delivery and final total.`].join('\n');
  return <section className="section"><p className="eyebrow">Your selection</p><h1 style={{ fontSize: 48 }}>Shopping cart</h1>{!items.length ? <div className="empty-state"><h2>Your cart is empty.</h2><p>Find your next upgrade and add it to your cart.</p><Link className="button" href="/products">Browse products</Link></div> : <div className="cart-layout"><div>{lines.map(line => { const v = line.variant, p = v.product, image = p.images[0]; return <article className="cart-line" key={line.variantId}>{image && !p.archived && <Image src={image.url} alt={image.alt} width={110} height={110} unoptimized={image.url.startsWith('/media/')}/>}<div className="cart-line-details"><h2><Link href={`/products/${p.slug}`}>{p.name}</Link></h2><p>{[v.storage, v.color, v.condition.replaceAll('_', ' ')].filter(Boolean).join(' · ')}</p><p>{formatMoney(line.unitPrice)} each · <strong>{formatMoney(line.lineTotal)}</strong></p>{!line.valid && <p className="error">{p.archived || p.demo ? 'This product is no longer available. Please remove it.' : `Only ${line.available} available. Update the quantity or remove this item.`}</p>}<CartControls key={`${line.variantId}-${line.quantity}`} variantId={line.variantId} quantity={line.quantity} available={line.available}/></div></article>; })}<Link className="text-link" href="/products">← Continue shopping</Link></div><aside className="admin-panel cart-summary"><h2>Order summary</h2><p className="cart-subtotal"><span>Product subtotal</span><strong>{formatMoney(subtotal)}</strong></p><p className="admin-hint">Prices reflect current listings. Delivery is confirmed by the store. Items are not reserved until your order is confirmed.</p>{lines.some(line => !line.valid) && <p className="error">Unavailable quantities are excluded from the subtotal. Update or remove them to continue.</p>}{lines.every(line => line.valid) && <a className="button button-whatsapp" href={whatsappLink(message)} target="_blank" rel="noopener noreferrer">Order on WhatsApp</a>}<p className="admin-hint">Online payment checkout is not available yet.</p></aside></div>}</section>;
}
