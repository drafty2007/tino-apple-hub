'use client';
import { useActionState, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { saveProduct } from './actions';
import Image from 'next/image';
import { preparePhotoInBrowser } from '@/lib/prepare-photo-client';
import { createPhotoId } from '@/lib/photo-id';
type Variant = { id?: string; sku: string; storage: string; color: string; condition: 'NEW' | 'UK_USED' | 'REFURBISHED'; batteryHealth: string; price: string; discountPrice: string; quantity: number };
export type ProductFormData = { id?: string; version?: string; name: string; slug: string; brand: string; categoryId: string; description: string; specifications: string; featured: boolean; archived: boolean; variants: Variant[]; images: { id: string; url: string; alt: string }[] };
const blankVariant = (): Variant => ({ sku: '', storage: '', color: '', condition: 'NEW', batteryHealth: '', price: '', discountPrice: '', quantity: 0 });
export default function ProductForm({ initial, categories, uploadsEnabled }: { initial?: ProductFormData; categories: { id: string; name: string }[]; uploadsEnabled: boolean }) {
  const [product, setProduct] = useState<ProductFormData>(initial ?? { name: '', slug: '', brand: '', categoryId: categories[0]?.id ?? '', description: '', specifications: '', featured: false, archived: true, variants: [blankVariant()], images: [] });
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [preparing, setPreparing] = useState(false);
  const router = useRouter();
  const [queued, setQueued] = useState<{ id: string; file: File; preview: string }[]>([]);
  const previews = useRef(new Set<string>());
  useEffect(() => { const urls = previews.current; return () => { urls.forEach(url => URL.revokeObjectURL(url)); }; }, []);
  const [progress, setProgress] = useState('');
  const [state, action, pending] = useActionState(async (_: { error?: string }, form: FormData) => {
    setUploadError('');
    try {
      const saved = await saveProduct({}, form);
      if (saved.error || !saved.productId || !saved.version) return { error: saved.error ?? 'Could not save the product.' };
      const productId = saved.productId;
      let version = saved.version;
      setProduct(p => ({ ...p, id: productId, version, variants: p.variants.map((v, index) => ({ ...v, id: saved.variantIds?.[v.sku || `index:${index}`] ?? v.id })) }));
      setUploading(true);
      for (let index = 0; index < queued.length; index++) {
        const photo = queued[index];
        setProgress(`Uploading photo ${index + 1} of ${queued.length}…`);
        const body = new FormData(); body.set('file', photo.file); body.set('productId', productId); body.set('version', version);
        const response = await fetch('/api/admin/images', { method: 'POST', body });
        const result = response.headers.get('content-type')?.includes('application/json') ? await response.json() : null;
        if (!response.ok || !result?.image) throw new Error(result?.error ?? 'The server could not accept this photo. Try a smaller image.');
        version = result.version;
        const updatedVersion = version;
        setProduct(p => ({ ...p, version: updatedVersion, images: [...p.images, result.image] }));
        setQueued(p => p.filter(item => item.id !== photo.id));
        URL.revokeObjectURL(photo.preview); previews.current.delete(photo.preview);
      }
      router.push(`/admin/products/${productId}?saved=1`); router.refresh();
      return {};
    } catch (error) { return { error: error instanceof Error ? error.message : 'Could not save. Your selected photos are kept so you can retry.' }; }
    finally { setUploading(false); setProgress(''); }
  }, {});
  function field(key: string, value: string | boolean) { setProduct(p => ({ ...p, [key]: value })); }
  function variant(index: number, key: string, value: string | number) { setProduct(p => ({ ...p, variants: p.variants.map((v, i) => i === index ? { ...v, [key]: value } : v) })); }
  async function choosePhotos(files: FileList | null) {
    if (!files) return;
    setUploadError('');
    const selected = Array.from(files);
    if (product.images.length + queued.length + selected.length > 10) { setUploadError('You can add up to 10 photos per product.'); return; }
    if (selected.some(file => !file.size || file.size > 50 * 1024 * 1024)) {
      setUploadError('One of these files is empty or too large to open. Please choose another copy.'); return;
    }
    setPreparing(true);
    try {
      const photos: { id: string; file: File; preview: string }[] = [];
      for (const original of selected) {
        const file = await preparePhotoInBrowser(original);
        const preview = URL.createObjectURL(file); previews.current.add(preview);
        photos.push({ id: createPhotoId(), file, preview });
      }
      setQueued(p => [...p, ...photos]);
    } finally { setPreparing(false); }
  }
  return <form action={action} className="admin-form"><input type="hidden" name="uploadAfterSave" value="true"/><input type="hidden" name="payload" value={JSON.stringify({ ...product, imageIds: product.images.map(i => i.id) })}/>
    {state.error && <p role="alert" className="form-alert">{state.error}</p>}
    <section className="admin-panel"><h2>Product details</h2><div className="form-grid">
      <label>Product name<input value={product.name} onChange={e => field('name', e.target.value)} required maxLength={160}/></label>
      {initial?.id && <><label>Product URL slug<input value={product.slug} onChange={e => field('slug', e.target.value)} placeholder="iphone-16-pro" required pattern="[a-z0-9]+(-[a-z0-9]+)*"/><small>Lowercase letters, numbers and hyphens; must be unique.</small></label>
      <label>Brand<input value={product.brand} onChange={e => field('brand', e.target.value)} maxLength={80}/></label></>}
      <label>Category<select value={product.categoryId} onChange={e => field('categoryId', e.target.value)} required><option value="">Choose a category</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
    </div><label>Description<textarea value={product.description} onChange={e => field('description', e.target.value)} minLength={10} maxLength={10000} required rows={5}/></label>
    <div className="check-row"><label><input type="checkbox" checked={product.featured} onChange={e => field('featured', e.target.checked)}/> Featured on homepage</label><label><input type="checkbox" checked={!product.archived} onChange={e => field('archived', !e.target.checked)}/> Published on storefront</label></div><p className="admin-hint">Uncheck Published to archive a product without losing its order history.</p></section>
    <section className="admin-panel"><h2>Variants & inventory</h2><p className="admin-hint">One row per storage, colour, and condition. Prices are entered in Ghana cedis.</p>{product.variants.map((v, i) => <fieldset key={v.id ?? i}><legend>Variant {i + 1}</legend><div className="form-grid">
      <label>Storage<input value={v.storage} onChange={e => variant(i, 'storage', e.target.value)} maxLength={40} placeholder="256 GB"/></label>
      <label>Colour<input value={v.color} onChange={e => variant(i, 'color', e.target.value)} required maxLength={60}/></label>
      <label>Condition<select value={v.condition} onChange={e => variant(i, 'condition', e.target.value)}><option value="NEW">New</option><option value="UK_USED">UK-used</option><option value="REFURBISHED">Refurbished</option></select></label>
      <label>Price (GH₵)<input type="number" min="0" max="9999999" step="0.01" value={v.price} onChange={e => variant(i, 'price', e.target.value)} required/></label>
      <label>Discount price (optional)<input type="number" min="0" step="0.01" value={v.discountPrice} onChange={e => variant(i, 'discountPrice', e.target.value)}/></label>
      <label>Total stock quantity<input type="number" min="0" max="100000" step="1" value={v.quantity} onChange={e => variant(i, 'quantity', e.target.value === '' ? 0 : Number(e.target.value))} required/></label>
      <label>Battery health % (optional)<input type="number" min="0" max="100" step="1" value={v.batteryHealth} onChange={e => variant(i, 'batteryHealth', e.target.value)}/></label>
    </div>{!v.id && product.variants.length > 1 && <button type="button" className="secondary-button" onClick={() => setProduct(p => ({ ...p, variants: p.variants.filter((_, n) => n !== i) }))}>Remove unsaved variant</button>}</fieldset>)}<button type="button" className="secondary-button" disabled={product.variants.length >= 30} onClick={() => setProduct(p => ({ ...p, variants: [...p.variants, blankVariant()] }))}>+ Add variant</button></section>
    <section className="admin-panel"><h2>Product photos</h2>
    <p className="admin-hint">Choose your images. We resize and convert them automatically. The first photo is the cover image.</p>
    {!uploadsEnabled && <p className="form-alert">Photo storage needs configuration. Your product details can still be saved.</p>}
    <div className="image-list">
      {product.images.map((img, index) => <div key={img.id}><Image src={img.url} alt={img.alt} width={130} height={120} unoptimized={img.url.startsWith('/media/')}/><small>{index === 0 ? 'Cover photo' : 'Saved photo'}</small><button type="button" className="secondary-button" disabled={pending} onClick={() => setProduct(p => ({ ...p, images: p.images.filter(x => x.id !== img.id) }))}>Remove photo</button></div>)}
      {queued.map(photo => <div key={photo.id}><Image src={photo.preview} alt={`Preview: ${photo.file.name}`} width={130} height={120} unoptimized/><small>Ready to upload</small><button type="button" className="secondary-button" disabled={pending} onClick={() => { setQueued(p => p.filter(x => x.id !== photo.id)); URL.revokeObjectURL(photo.preview); previews.current.delete(photo.preview); }}>Remove photo</button></div>)}
    </div>
    <label className="photo-picker">Choose photos<input type="file" accept="image/*,.heic,.heif,.avif,.tif,.tiff,.bmp,.ico" multiple disabled={!uploadsEnabled || pending || preparing || product.images.length + queued.length >= 10} onChange={e => { void choosePhotos(e.target.files); e.target.value = ''; }}/></label>
    {preparing && <p role="status">Preparing your photos…</p>}
    <p className="admin-hint">{product.images.length + queued.length} / 10 photos · {queued.length} waiting to upload</p>
    {progress && <p role="status" aria-live="polite">{progress}</p>}{uploadError && <p role="alert" className="form-alert">{uploadError}</p>}</section>
    <button className="button" disabled={pending || uploading || preparing || !categories.length}>{pending ? (uploading ? 'Uploading photos…' : 'Saving…') : 'Save product'}</button>
  </form>;
}


