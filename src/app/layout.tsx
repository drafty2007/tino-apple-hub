import CartLink from "@/components/cart-link";
import { storeContact, whatsappLink } from "@/lib/store-contact";
import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';
export const metadata: Metadata = { title: { default: 'TINO APPLE HUB', template: '%s | TINO APPLE HUB' }, description: 'Smartphones and accessories in Ghana.' };
export default function Layout({ children }: { children: React.ReactNode }) {
  return <html lang="en-GH"><body><a className="skip" href="#main">Skip to content</a><div className="announcement">TINO APPLE HUB · Smartphones & accessories · Takoradi, Ghana</div><header><div className="brand-block"><Link className="logo" href="/">TINO<span>APPLE HUB</span></Link><p className="brand-location">Takoradi, Ghana</p></div><nav aria-label="Main navigation"><Link href="/products">Collection</Link><Link href="/#promise">Our promise</Link><CartLink/><Link href="/login">Sign in</Link></nav></header><main id="main">{children}</main><footer><Link className="logo" href="/">TINO<span>APPLE HUB</span></Link><p>Thoughtfully chosen. Ready for what’s next.</p><p><a href={`tel:${storeContact.phoneInternational}`}>{storeContact.phoneDisplay}</a> · <a href={whatsappLink()} target="_blank" rel="noopener noreferrer">WhatsApp us</a></p><small>© 2026 TINO APPLE HUB. All rights reserved.</small></footer></body></html>;
}







