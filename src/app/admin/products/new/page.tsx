import { imageStorageMode } from "@/lib/image-storage-config";
import { database } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import ProductForm from '../product-form';
export default async function NewProduct() {
  await requireAdmin();
  const categories = await database().category.findMany({ orderBy: { name: 'asc' } });
  return <><div className="admin-heading"><div><p className="eyebrow">Catalog</p><h1>Add product</h1><p>Enter real product information. Save unpublished until ready.</p></div></div><ProductForm categories={categories} uploadsEnabled={imageStorageMode() !== "unconfigured"}/></>;
}

