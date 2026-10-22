import { NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { assertSameOrigin, rateLimit } from '@/lib/security';
import { database } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { prepareProductImage, ImageValidationError, MAX_IMAGE_BYTES, MAX_PRODUCT_IMAGES } from '@/lib/image-upload';
import { imageStorageMode } from '@/lib/image-storage-config';
import { storeProductImage } from '@/lib/image-storage';
export const runtime = 'nodejs';
class ConflictError extends Error {}
export async function POST(request: Request) {
  const actor = await currentUser();
  if (!actor || actor.role === 'CUSTOMER') return NextResponse.json({ error: 'Please sign in as an administrator again.' }, { status: 403 });
  try { await assertSameOrigin(); await rateLimit(`upload:${actor.id}`, 60); }
  catch { return NextResponse.json({ error: 'Request blocked. Check your store address or try again later.' }, { status: 403 }); }
  if (imageStorageMode() === 'unconfigured') return NextResponse.json({ error: 'Configure all three Cloudinary credentials to enable production photo uploads.' }, { status: 503 });
  const reader = request.body?.getReader();
  if (!reader) return NextResponse.json({ error: 'Choose a photo.' }, { status: 400 });
  const chunks: Uint8Array[] = []; let size = 0;
  let stored: Awaited<ReturnType<typeof storeProductImage>> | undefined;
  try {
    while (true) {
      const { done, value } = await reader.read(); if (done) break;
      size += value.length;
      if (size > MAX_IMAGE_BYTES + 16384) { await reader.cancel(); return NextResponse.json({ error: 'This image is too large to process. Please choose a smaller copy.' }, { status: 413 }); }
      chunks.push(value);
    }
    const form = await new Response(Buffer.concat(chunks), { headers: { 'content-type': request.headers.get('content-type') ?? '' } }).formData();
    const file = form.get('file'), productId = String(form.get('productId') ?? ''), version = String(form.get('version') ?? '');
    if (!(file instanceof File)) throw new ImageValidationError('Choose an image to upload.');
    const product = await database().product.findUnique({ where: { id: productId }, include: { _count: { select: { images: true } } } });
    if (!product) return NextResponse.json({ error: 'Save the product before uploading.' }, { status: 404 });
    if (product._count.images >= MAX_PRODUCT_IMAGES) throw new ImageValidationError('Maximum 10 photos per product.');
    if (product.updatedAt.toISOString() !== version) throw new ConflictError('This product changed in another session. Reload before uploading.');
    const bytes = await prepareProductImage(file);
    stored = await storeProductImage(bytes);
    const asset = stored;
    const saved = await database().$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM "Product" WHERE id = ${productId} FOR UPDATE`;
      const current = await tx.product.findUniqueOrThrow({ where: { id: productId } });
      if (current.updatedAt.toISOString() !== version) throw new ConflictError('This product changed while uploading. Reload before trying again.');
      const count = await tx.productImage.count({ where: { productId } });
      if (count >= MAX_PRODUCT_IMAGES) throw new ImageValidationError('Maximum 10 photos per product.');
      const image = await tx.productImage.create({ data: { productId, url: asset.url, publicId: asset.publicId, alt: product.name, position: count } });
      const updated = await tx.product.update({ where: { id: productId }, data: { updatedAt: new Date() } });
      await tx.auditLog.create({ data: { actorId: actor.id, action: 'PRODUCT_IMAGE_UPLOADED', entityId: productId } });
      return { image: { id: image.id, url: image.url, alt: image.alt }, version: updated.updatedAt.toISOString() };
    });
    stored = undefined;
    revalidatePath('/'); revalidatePath('/products'); revalidatePath(`/products/${product.slug}`);
    return NextResponse.json(saved);
  } catch (error) {
    if (stored) await stored.discard().catch(() => {});
    if (error instanceof ImageValidationError || error instanceof ConflictError) return NextResponse.json({ error: error.message }, { status: error instanceof ConflictError ? 409 : 400 });
    return NextResponse.json({ error: 'Photo upload failed. Your product is saved; retry the remaining photos. Check storage configuration if this continues.' }, { status: 500 });
  }
}
