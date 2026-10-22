export function isAllowedRequestOrigin(origin: string | null, env: NodeJS.ProcessEnv = process.env) {
  if (!origin || !env.APP_URL) return false;
  try {
    if (origin === new URL(env.APP_URL).origin) return true;
    if (env.NODE_ENV !== 'development') return false;
    return (env.DEV_ALLOWED_ORIGINS ?? '').split(',').filter(Boolean).some(value => origin === new URL(value.trim()).origin);
  } catch { return false; }
}
