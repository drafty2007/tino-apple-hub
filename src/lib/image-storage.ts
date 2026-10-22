import { randomUUID } from 'node:crypto';
import { mkdir, writeFile, unlink } from 'node:fs/promises';
import path from 'node:path';
import { imageStorageMode } from './image-storage-config';
export const uploadDirectory = () => path.join(process.cwd(), 'data', 'uploads');
export async function storeProductImage(bytes: Buffer): Promise<{ url: string; publicId: string; discard: () => Promise<void> }> {
  const mode = imageStorageMode();
  if (mode === 'unconfigured') throw new Error('Image storage is not configured.');
  const id = randomUUID();
  if (mode === 'local') {
    const filename = `${id}.webp`;
    await mkdir(uploadDirectory(), { recursive: true });
    const filePath = path.join(uploadDirectory(), filename);
    await writeFile(filePath, bytes, { flag: 'wx' });
    return { url: `/media/${filename}`, publicId: `local:${id}`, discard: async () => { await unlink(filePath); } };
  }
  const cloud = process.env.CLOUDINARY_CLOUD_NAME!;
  const authorization = `Basic ${Buffer.from(`${process.env.CLOUDINARY_API_KEY}:${process.env.CLOUDINARY_API_SECRET}`).toString('base64')}`;
  const body = new FormData();
  body.set('file', new Blob([new Uint8Array(bytes)], { type: 'image/webp' }), `${id}.webp`);
  body.set('public_id', `tino-products/${id}`); body.set('overwrite', 'false');
  const base = `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloud)}/image`;
  const response = await fetch(`${base}/upload`, { method: 'POST', headers: { Authorization: authorization }, body, signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw new Error('Cloudinary rejected the photo.');
  const result = await response.json(); const url = new URL(result.secure_url);
  if (url.protocol !== 'https:' || url.hostname !== 'res.cloudinary.com' || result.resource_type !== 'image' || result.public_id !== `tino-products/${id}` || result.format !== 'webp') throw new Error('Invalid storage response.');
  return { url: url.href, publicId: result.public_id, discard: async () => {
    const remove = new FormData(); remove.set('public_id', result.public_id);
    await fetch(`${base}/destroy`, { method: 'POST', headers: { Authorization: authorization }, body: remove, signal: AbortSignal.timeout(10000) });
  } };
}
