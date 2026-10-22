# Publish the current catalog and WhatsApp store

Publishing is authorized for the current scope: public catalog, variant details, guest cart and WhatsApp enquiries. Online payment checkout remains unavailable. The full original commerce scope is not complete. This guide supersedes the old Phase 1 deployment warning for this limited launch.

## Accounts to create

Create business-owned accounts for Netlify (hosting), Neon (online PostgreSQL), and Cloudinary (persistent images). Choose free plans initially and review their usage limits. Do not select paid upgrades, add-on services, trials requiring payment, or purchase a domain without approval. Netlify's Free plan supports commercial projects. The store can initially use a Netlify HTTPS subdomain.

- Netlify: https://app.netlify.com/signup
- Neon: https://console.neon.tech/signup
- Cloudinary: https://cloudinary.com/users/register/free

You must complete sign-up, any verification, and acceptance of account terms yourself. Never paste API secrets, database URLs or passwords into chat.

## Before the first deployment

1. Create a private source repository in the store owner's account or authenticate Netlify CLI for a direct project deploy. Review the upload contents first. `.env`, uploaded local assets, database backups and dependency caches must never enter the source repository or deployment archive. `.netlifyignore` and `.gitignore` exclude these.
2. Create a dedicated Neon project/database for this store. Save its connection URL privately as a production secret, preserving provider TLS options. Keep the local DATABASE_URL unchanged. The production app cannot connect to `127.0.0.1` on the development computer.
3. Create a dedicated Cloudinary product environment. Enter cloud name, API key and API secret in the hosting dashboard. Keep secrets server-only.
4. Back up the local database and `data/uploads/` to an ignored, private location. Transfer reviewed business data to the online database, including categories, products, variants, inventories, settings, and the existing owner's password hash. Do not copy active sessions, password-reset tokens, guest carts, rate-limit counters or diagnostic fixtures. Match PostgreSQL versions and verify row counts and prices. Do not overwrite a populated target database.
5. Upload every referenced local product photo to Cloudinary. Update the online database image URLs/public IDs only after each upload succeeds. Verify every published product image loads over HTTPS. Keep the local files and local database intact as a backup and development copy.
6. Apply and record the committed Prisma migrations to the intended target database as part of the migration process; do not run development migrations against production. Use a separate migration credential where possible and restricted runtime credentials.

## Netlify project settings

The committed `netlify.toml` uses Node 22, runs the environment preflight and `pnpm run build`, and publishes the Next.js build through Netlify's automatic adapter. Do not upload `.next` as static files or use Netlify's static drag-and-drop deployment for this application.

Configure the following in Netlify's private environment settings for build and functions:

```text
DATABASE_URL=<online PostgreSQL connection URL with TLS>
APP_URL=https://<assigned-project-name>.netlify.app
CLOUDINARY_CLOUD_NAME=<cloud name>
CLOUDINARY_API_KEY=<API key>
CLOUDINARY_API_SECRET=<API secret>
PAYSTACK_MODE=test
```

Do not configure OWNER_PASSWORD, local DEV_ALLOWED_ORIGINS or live Paystack secrets. Set APP_URL to the exact public origin so login, product saves and cart mutations pass origin checks. Redeploy after changing environment values.

## Verify the deployed site before sharing it

Check the homepage, all category filters, every published product and photo, admin login and logout with secure cookies, product edits/uploads, guest cart persistence/isolation and WhatsApp order text. Verify that anonymous requests cannot access admin pages, that demo/unpublished products stay private and that local image URLs are no longer referenced. Verify backups and recovery. Confirm hosting audience is public and the external URL works without a hosting-account login.

Provider documentation: https://docs.netlify.com/build/frameworks/framework-setup-guides/nextjs/overview/ and https://neon.com/docs/import/migrate-from-postgres.

No online service, database or deployment has been created by adding these files. Publishing still requires authenticated accounts, production credentials, data/image migration and a successful deploy.
