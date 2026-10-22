// Normalize anything the browser can open (including BMP and GIF) before upload.
// Other formats are sent intact so the server decoder can try them too.
export async function preparePhotoInBrowser(file: File): Promise<File> {
  let bitmap: ImageBitmap | undefined;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    const scale = Math.min(1, 2000 / bitmap.width, 2000 / bitmap.height);
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext('2d');
    if (!context) return file;
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/webp', 0.85));
    return blob ? new File([blob], file.name.replace(/\.[^.]+$/, '') + '.webp', { type: blob.type }) : file;
  } catch { return file; }
  finally { bitmap?.close(); }
}
