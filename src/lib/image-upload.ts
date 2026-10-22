import sharp from 'sharp';
export const MAX_IMAGE_BYTES = 50 * 1024 * 1024;
export const MAX_PRODUCT_IMAGES = 10;
export class ImageValidationError extends Error {}
export async function prepareProductImage(file: File) {
  if (!file.size) throw new ImageValidationError('This file is empty. Choose another image.');
  if (file.size > MAX_IMAGE_BYTES) throw new ImageValidationError('This image is too large to process. Please choose a smaller copy.');
  try {
    const bytes = Buffer.from(await file.arrayBuffer());
    const metadata = await sharp(bytes, { limitInputPixels: 100000000, animated: false, failOn: 'none' }).metadata();
    if (!metadata.width || !metadata.height) throw new Error('Invalid image');
    // Fully decode and re-encode, removing metadata and arbitrary appended content.
    return await sharp(bytes, { limitInputPixels: 100000000, animated: false, failOn: 'none' }).rotate().resize({ width: 2000, height: 2000, fit: 'inside', withoutEnlargement: true }).webp({ quality: 85 }).toBuffer();
  } catch { throw new ImageValidationError('This file could not be opened as an image. Try another copy of the photo.'); }
}
