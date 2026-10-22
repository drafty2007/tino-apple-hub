# TINO APPLE HUB

A reusable, single-store Next.js / PostgreSQL commerce application under development. **This initial implementation is Phase 1, not a production-ready store.** No payments, inventory, customer data, or public accounts are fabricated.

## Local setup

Use Node.js 22.12+ and pnpm. Run `pnpm install`, copy `.env.example` to `.env`, and provide a dedicated PostgreSQL database URL. Set `APP_URL` to the exact browser origin.

1. `pnpm db:generate`
2. `pnpm db:deploy` (applies the committed initial schema and integrity migrations)
3. `pnpm db:seed` (settings and categories only)
4. Set `OWNER_EMAIL` and a unique `OWNER_PASSWORD` of at least 16 characters in your local environment.
5. `pnpm owner:create`. This command refuses to run when an owner already exists. It has no public HTTP endpoint. Remove the password from your environment afterward.
6. `pnpm dev`; visit `http://localhost:3000` and `/login`.

Validation: `pnpm test`, `pnpm lint`, `pnpm typecheck`, `pnpm build`. Generate Prisma before type checks. Database-backed workflows require a migrated test PostgreSQL database; unit tests alone do not verify these workflows.

## Architecture

App Router pages and server actions share a PostgreSQL database through Prisma 7's PostgreSQL adapter. Public components must never import database credentials or payment secrets. Protected layouts guard admin rendering; each future mutation must independently call `requireAdmin`, validate with Zod, validate origin, and create an audit entry in the same transaction as its mutation. Staff cannot manage owners, credentials, or business settings.

Money is integer pesewas. Product variants own SKUs and inventory. Orders snapshot product details, prices, and shipping details. Sessions store only SHA-256 digests of random 256-bit cookie tokens. Passwords use salted scrypt. Login buckets use PostgreSQL upserts so counters are shared across instances. Production requires HTTPS for secure session cookies.

See [implementation plan](docs/IMPLEMENTATION.md) and [deployment guide](docs/DEPLOYMENT.md).

## Current limits

Implemented: design foundation, schema, owner bootstrap, sign-in/sign-out, protected admin overview, product/category management, variant prices and inventory, archive/publication controls, authenticated Cloudinary image-upload code, public catalog/detail pages, featured homepage products, and WhatsApp enquiries. See [admin guide](docs/ADMIN.md). Registration/reset emails, checkout, Paystack and remaining order/customer/content/settings administration are outstanding. Local PostgreSQL migrations and owner setup are verified. Local development image uploads now use data/uploads/ and pass an authenticated upload/serving integration check. Production Cloudinary uploads still require credentials and a real-provider test.


Shopping cart: database-backed guest carts, add/update/remove controls, current-price totals and WhatsApp order enquiries are implemented. See [cart guide](docs/CART.md).

