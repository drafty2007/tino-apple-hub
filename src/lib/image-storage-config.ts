export function imageStorageMode(env: NodeJS.ProcessEnv = process.env): 'cloudinary' | 'local' | 'unconfigured' {
  const values = [env.CLOUDINARY_CLOUD_NAME, env.CLOUDINARY_API_KEY, env.CLOUDINARY_API_SECRET];
  if (values.every(Boolean)) return 'cloudinary';
  // Local disk is a development convenience, never an ephemeral production fallback.
  if (!values.some(Boolean) && env.NODE_ENV !== 'production') return 'local';
  return 'unconfigured';
}
