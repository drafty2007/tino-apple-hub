import ProductCollection from "@/components/product-collection";
import Link from "next/link";
export const dynamic = 'force-dynamic';
import { storeContact, whatsappLink } from "@/lib/store-contact";
import Image from "next/image";
export default function Home() {
  return <><section className="hero"><div><p className="eyebrow">Tino Apple Hub · Ghana</p><h1>Your next upgrade.<br/><em>A better everyday.</em></h1><p className="lead">Explore iPhones, Samsung phones, Google Pixel, and everyday essentials at TINO APPLE HUB. Find the technology that fits your life.</p><Link className="button" href="/products">Explore the collection <span aria-hidden="true"> ↗</span></Link></div><div className="visual"><Image className="hero-image" src="/images/home-phones.jpg" alt="iPhones shown from the front and back in silver, orange, and dark blue" width={867} height={709} sizes="(max-width: 700px) 90vw, 45vw" preload /></div></section><section className="section" id="collection"><p className="eyebrow">Find your fit</p><h2>Great technology. Your way.</h2><div className="grid">{[['iPhones', 'Explore the Apple experience. Find your preferred model, finish, and storage.', 'iphones'], ['Samsung Phones', 'Discover Galaxy smartphones for work, creativity, and everyday connection.', 'samsung'], ['Google Pixel', 'Explore Google Pixel phones for photos, connection, and everyday life.', 'google-pixel'], ['Accessories', 'Complete your setup with charging, protection, and everyday essentials.', 'accessories']].map(([name, description, slug])=><Link className="tile collection-link" key={slug} href={`/products?category=${slug}`}><h3>{name}</h3><p>{description}</p><span>View products <span aria-hidden="true">→</span></span></Link>)}</div><p className="notice">Online checkout is not available yet. Contact us on WhatsApp to confirm current availability and pricing.</p></section><section className="section"><p className="eyebrow">The latest collection</p><h2>Find your next upgrade.</h2><ProductCollection featured/><Link className="button" href="/products">View all products</Link></section><section className="section" id="promise"><p className="eyebrow">A little more confidence</p><h2>Details that make a difference.</h2><div className="grid"><article className="tile"><h3>Know your device.</h3><p>Clear specifications, condition, storage, and battery details where applicable.</p></article><article className="tile"><h3>Made for Ghana.</h3><p>Smartphones and accessories for life in Ghana.</p></article><article className="tile"><h3>Here to help.</h3><p>Have a model, storage capacity, or colour in mind? Get in touch to discuss your next upgrade.</p><p><a href={`tel:${storeContact.phoneInternational}`}>{storeContact.phoneDisplay}</a></p><a className="button button-whatsapp" href={whatsappLink()} target="_blank" rel="noopener noreferrer">Chat on WhatsApp</a></article></div></section></>;
}








