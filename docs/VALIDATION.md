# Validation record

## Image upload update

- Local authenticated upload/storage/serving is verified against the running development server and PostgreSQL, using disposable unpublished fixtures removed by the check script.
- `node scripts/check-local-upload.mjs` passes: successful upload, WebP serving, unpublished-photo privacy, anonymous upload rejection, invalid image rejection, stale-version rejection. The fixture uses the database timestamp convention in UTC and has a short-lived test-only session.
- 26 unit tests pass, including real image decoding/resizing, mismatched MIME rejection, oversized/invalid/SVG rejection, storage-mode selection and deferred-save product/variant identity for retries.
- ESLint, TypeScript, and optimized production build pass.
- Real Cloudinary round trips remain untested without credentials. Local development uses `data/uploads/`; production requires configured Cloudinary and never falls back to local storage.
- Selected photos are previewed before saving. Product data saves before uploads; partial upload failure retains completed uploads and keeps the remaining browser-selected files for retry while the form stays open.

## Admin product-management update

- Added guarded overview, product list/search/status filter, create/edit forms, categories, multi-variant inventory and prices, publication/archive controls, and audited serializable mutations.
- Added authenticated, origin-checked, rate-limited Cloudinary upload route with streaming request size limit and JPEG/PNG/WebP MIME/signature checks. Real upload requires credentials and is unverified.
- Connected published catalog and detail pages to PostgreSQL; featured products appear on the homepage; variant WhatsApp links include SKU and price.
- Fifteen unit tests pass, including product validation, auth/origin rejection before writes, stale editor rejection, price conversion, and transactional inventory/audit calls. Server-action tests mock the database; they do not prove PostgreSQL rollback or concurrency behavior.
- ESLint and TypeScript pass. Optimized production build passes with the new admin and storefront routes. HTTP GET `/admin` returns 200 with the unconfigured-store setup screen.
- PostgreSQL is not configured: migrations, owner bootstrap, authenticated navigation, real product persistence, isolation under concurrent stock changes, and real image uploads still need staging verification. Browser layout inspection for the new admin screens is outstanding.

## Initial foundation

Completed locally on 21 October 2026:

- Prisma schema validation passed and Prisma 7.10.1 client generated.
- Initial migration generated from the schema. Additional SQL constraints enforce inventory, money, quantities, discounts, and battery ranges. Migration application is untested without PostgreSQL.
- Four password/token unit tests passed (valid and invalid passwords, independent salts, malformed hash rejection, token digest behavior).
- ESLint passed after fixing internal navigation and config export.
- Next.js 16.4.2 optimized production build passed, including application TypeScript checks. Routes: `/`, `/login`, `/admin`.
- Next.js applied its standard TypeScript `skipLibCheck` option after an upstream URLPattern declaration mismatch. Strict checking remains enabled for application code.

Not verified: database migration application, owner creation, login/session persistence and revocation against PostgreSQL, concurrent setup/rate limiting, responsive browser inspection, accessibility with assistive technology, email delivery, image uploads, Paystack, and all workflows planned for phases 2–5. Unit/build success does not establish production readiness.
