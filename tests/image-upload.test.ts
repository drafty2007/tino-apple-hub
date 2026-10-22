import { describe, expect, it } from 'vitest';
import sharp from 'sharp';
import { prepareProductImage, MAX_IMAGE_BYTES } from '../src/lib/image-upload';
import { imageStorageMode } from '../src/lib/image-storage-config';
describe('Product image processing', () => {
  it('decodes, resizes and normalizes a real photo', async () => {
    const png = await sharp({ create: { width: 2500, height: 500, channels: 3, background: '#228833' } }).png().toBuffer();
    const result = await prepareProductImage(new File([new Uint8Array(png)], 'test.png', { type: 'image/png' }));
    const meta = await sharp(result).metadata();
    expect(meta.format).toBe('webp'); expect(meta.width).toBe(2000); expect(meta.exif).toBeUndefined();
  });
  it('rejects executable text disguised as a JPEG', async () => {
    await expect(prepareProductImage(new File(['<script>alert(1)</script>'], 'fake.jpg', { type: 'image/jpeg' }))).rejects.toThrow('could not be opened');
  });
  it('accepts GIF, TIFF and AVIF without requiring a matching browser MIME type', async () => {
    for (const format of ['gif', 'tiff', 'avif'] as const) {
      const bytes = await sharp({ create: { width: 4, height: 4, channels: 3, background: '#44bb88' } }).toFormat(format).toBuffer();
      const result = await prepareProductImage(new File([new Uint8Array(bytes)], `photo.${format}`, { type: 'application/octet-stream' }));
      expect((await sharp(result).metadata()).format).toBe('webp');
    }
  });
  it('detects the actual image regardless of its label and rejects oversized files', async () => {
    const png = await sharp({ create: { width: 2, height: 2, channels: 3, background: '#fff' } }).png().toBuffer();
    await expect(prepareProductImage(new File([new Uint8Array(png)], 'fake.jpg', { type: 'image/jpeg' }))).resolves.toBeInstanceOf(Buffer);
    await expect(prepareProductImage(new File([new Uint8Array(MAX_IMAGE_BYTES + 1)], 'big.png', { type: 'image/png' }))).rejects.toThrow('too large');
  });
  it('rasterizes SVG into a static WebP image', async () => {
    const result = await prepareProductImage(new File(['<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"><rect width="20" height="20" fill="blue"/></svg>'], 'test.svg', { type: 'image/svg+xml' }));
    expect((await sharp(result).metadata()).format).toBe('webp');
  });
});
describe('Storage configuration', () => {
  it('uses local disk only during development without Cloudinary credentials', () => {
    expect(imageStorageMode({ NODE_ENV: 'development' })).toBe('local');
    expect(imageStorageMode({ NODE_ENV: 'production' })).toBe('unconfigured');
    expect(imageStorageMode({ NODE_ENV: 'development', CLOUDINARY_API_KEY: 'partial' })).toBe('unconfigured');
  });
  it('uses configured Cloudinary in production', () => {
    expect(imageStorageMode({ NODE_ENV: 'production', CLOUDINARY_CLOUD_NAME: 'cloud', CLOUDINARY_API_KEY: 'key', CLOUDINARY_API_SECRET: 'secret' })).toBe('cloudinary');
  });
});

