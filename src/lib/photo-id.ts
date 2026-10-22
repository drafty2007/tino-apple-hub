// randomUUID requires HTTPS on phones; getRandomValues also works on local HTTP.
// These IDs identify queued UI previews only, never authentication credentials.
export function createPhotoId() {
  const bytes = globalThis.crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, value => value.toString(16).padStart(2, '0')).join('');
}
