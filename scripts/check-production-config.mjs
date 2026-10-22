// Deliberately does not load local .env: production must use hosting secrets.
const required = ['DATABASE_URL', 'APP_URL', 'CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];
const errors = required.filter(name => !process.env[name]?.trim()).map(name => `${name} is missing.`);
if (process.env.APP_URL) {
  try {
    const app = new URL(process.env.APP_URL);
    if (app.protocol !== 'https:' || app.pathname !== '/' || app.search || app.hash || app.username || app.password || app.port) errors.push('APP_URL must be the public HTTPS origin without a path or credentials.');
    if (app.hostname === 'localhost' || app.hostname === '0.0.0.0' || /^127\./.test(app.hostname)) errors.push('APP_URL cannot use a local computer address.');
  } catch { errors.push('APP_URL is invalid.'); }
}
if (process.env.DATABASE_URL) {
  try {
    const db = new URL(process.env.DATABASE_URL);
    const local = /^(localhost|0\.0\.0\.0|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(db.hostname);
    if (!['postgres:', 'postgresql:'].includes(db.protocol) || !db.hostname || !db.username || !db.password || db.pathname.length <= 1) errors.push('DATABASE_URL must contain a complete PostgreSQL connection.');
    if (local || db.hostname === '[::1]') errors.push('Production cannot connect to the database on your computer. Use online PostgreSQL.');
    if (!['require', 'verify-ca', 'verify-full'].includes(db.searchParams.get('sslmode'))) errors.push('Use the provider PostgreSQL connection URL with TLS enabled (sslmode=require or stricter).');
  } catch { errors.push('DATABASE_URL is invalid.'); }
}
if (process.env.OWNER_PASSWORD?.trim()) errors.push('Remove OWNER_PASSWORD from production. Create the owner privately or migrate its password hash.');
if ((process.env.PAYSTACK_SECRET_KEY ?? '').startsWith('sk_live_')) errors.push('Live payments are not approved or implemented. Remove the live Paystack key.');
if (errors.length) {
  console.error('Production configuration is incomplete (no secret values are shown):');
  errors.forEach(message => console.error(`- ${message}`));
  process.exitCode = 1;
} else console.log('Required production environment values are present. Database connectivity, data migration and real image uploads still need verification.');
