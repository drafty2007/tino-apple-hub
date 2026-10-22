import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { database } from '@/lib/db';
import { currentUser } from '@/lib/auth';
import { uploadDirectory } from '@/lib/image-storage';
export const runtime = 'nodejs';
export async function GET(_: Request, { params }: { params: Promise<{ filename: string }> }) {
  const { filename } = await params;
  if (!/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}\.webp$/.test(filename)) return new Response(null, { status: 404 });
  const image = await database().productImage.findUnique({ where: { publicId: `local:${filename.slice(0, -5)}` }, include: { product: { select: { archived: true } } } });
  if (!image) return new Response(null, { status: 404 });
  // Unpublished photos are accessible only to store administrators.
  if (image.product.archived) { const user = await currentUser(); if (!user || user.role === 'CUSTOMER') return new Response(null, { status: 404 }); }
  try {
    const file = await readFile(path.join(uploadDirectory(), filename));
    return new Response(file, { headers: { 'Content-Type': 'image/webp', 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'private, no-store' } });
  } catch { return new Response(null, { status: 404 }); }
}
