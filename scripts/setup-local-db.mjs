import { Client } from 'pg';
import { randomBytes } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const envPath = fileURLToPath(new URL('../.env', import.meta.url));
const password = process.env.TINO_SETUP_POSTGRES_PASSWORD;
delete process.env.TINO_SETUP_POSTGRES_PASSWORD;
if (!password) { console.error('Run setup-local-db.ps1 to enter your PostgreSQL password privately.'); process.exit(1); }
const admin = new Client({ host: '127.0.0.1', port: 5432, user: 'postgres', password, database: 'postgres', connectionTimeoutMillis: 5000 });
let stage = 'connect';
try {
  let content = await readFile(envPath, 'utf8');
  await admin.connect();
  const database = 'tino_apple_hub';
  const existing = await admin.query('SELECT 1 FROM pg_database WHERE datname = $1', [database]);
  if (existing.rowCount) {
    console.error('A database named tino_apple_hub already exists. Setup stopped without changing it. Ask for help connecting the existing database.');
    process.exitCode = 1;
  } else {
    stage = 'create';
    // Only generated alphanumeric identifiers and passwords enter this DDL.
    const role = `tino_store_${randomBytes(6).toString('hex')}`;
    const appPassword = randomBytes(32).toString('hex');
    await admin.query(`CREATE ROLE "${role}" LOGIN PASSWORD '${appPassword}' NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION`);
    await admin.query(`CREATE DATABASE "${database}" OWNER "${role}"`);
    const url = `postgresql://${role}:${appPassword}@127.0.0.1:5432/${database}`;
    content = content.replace(/^DATABASE_URL=.*$/m, `DATABASE_URL="${url}"`);
    if (!/^DATABASE_URL=/m.test(content)) content += `\nDATABASE_URL="${url}"\n`;
    content = content.replace(/^APP_URL=.*$/m, 'APP_URL=http://127.0.0.1:3000');
    await writeFile(envPath, content, { mode: 0o600 });
    console.log('Store database created. A dedicated non-superuser connection is saved in .env. No database password was displayed.');
    console.log('Return to the chat and say: database ready');
  }
} catch {
  console.error(stage === 'connect' ? 'Could not connect. Check the PostgreSQL password and confirm the service is running on port 5432.' : 'Setup could not finish. Ask for help before running it again; a database or role may already exist.');
  process.exitCode = 1;
} finally { await admin.end().catch(() => {}); }
