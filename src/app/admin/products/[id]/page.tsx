import { imageStorageMode } from "@/lib/image-storage-config";
import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { database } from '@/lib/db';
import ProductForm from '../product-form';
export default async function EditProduct({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const [p, categories] = await Promise.all([database().product.findUnique({ where: { id }, include: { variants: { include: { inventory: true }, orderBy: { sku: 'asc' } }, images: { orderBy: { position: 'asc' } } } }), database().category.findMany({ orderBy: { name: 'asc' } })]);
  if (!p) notFound();
  const specs = p.specifications as { details?: string };
  return <><div className="admin-heading"><div><p className="eyebrow">Catalog</p><h1>Edit product</h1><p>{p.name}</p></div></div>{(await searchParams).saved && <p className="success-message" role="status">Product saved successfully.</p>}<ProductForm categories={categories} uploadsEnabled={imageStorageMode() !== "unconfigured"} initial={{ id: p.id, version: p.updatedAt.toISOString(), name: p.name, slug: p.slug, brand: p.brand, categoryId: p.categoryId, description: p.description, specifications: specs.details ?? '', featured: p.featured, archived: p.archived, images: p.images.map(i => ({ id: i.id, url: i.url, alt: i.alt })), variants: p.variants.map(v => ({ id: v.id, sku: v.sku, color: v.color, storage: v.storage ?? '', condition: v.condition, batteryHealth: v.batteryHealth?.toString() ?? '', price: (v.price / 100).toFixed(2), discountPrice: v.discountPrice === null ? '' : (v.discountPrice / 100).toFixed(2), quantity: v.inventory?.quantity ?? 0 })) }}/></>;
}

