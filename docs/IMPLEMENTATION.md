# Implementation plan and acceptance gates

## Phase 1 — Foundation (in progress)

- Next.js App Router, TypeScript, Tailwind 4, accessible responsive foundation.
- PostgreSQL schema for users and roles, sessions, password reset tokens, catalog, images, variants, inventory, carts, orders, payments, addresses, settings, content, audit logs, rate limits, and webhook deduplication.
- Secure local first-owner bootstrap, sign-in, revocable sessions, admin role guard, server origin checks, database rate limiting.
- Gate: install dependencies; validate schema; generate and review migrations with quantity, price, battery, and discount constraints; unit tests; lint/type/build; database-backed authentication tests.
- Open: actual PostgreSQL connection, reset email provider, session management UI, registration.

## Phase 2 — Storefront

- Database-driven collection and detail pages; iPhone/Samsung/accessory filters, search, sort, pagination, variant selection, stock visibility.
- Persistent guest cart with signed/random ownership token, server quantities and prices; customer carts after login.
- Editable about, contact, FAQs, and policies; newsletter consent handling. Testimonials only from approved real sources.
- Gate: catalog and cart integration tests; keyboard, mobile and desktop browser checks.

## Phase 3 — Administration

Implemented in the product-management update: overview, searchable product list, create/edit/archive, variants and stock, category creation, audited serializable saves, configured Cloudinary upload endpoint, publication controls and public catalog integration. Setup and usage are in ADMIN.md. Database and upload integration verification remains pending; the remaining sections below are still outstanding.

- Audited product/category CRUD, archiving, Cloudinary signed uploads with MIME/size checks, inventory and discount validation.
- Order filters, delivery updates, spreadsheet-safe CSV export, customer search, revenue chart, low-stock warnings.
- Owner-only branding, content, policies, shipping zones, contact, SEO and staff/session administration. Secrets stay in hosting environment, never database text fields or browser responses.
- Gate: authorization matrix and transaction tests; updates visible in storefront without stale caches.

## Phase 4 — Orders and payments

- Server recomputes all prices and shipping; transactional conditional stock reservations, bounded quantities, checkout idempotency, reservation expiry/release job.
- Paystack test-key-only initialization, fixed callback origin, verified reference/currency/amount/status, HMAC webhook signature over raw bytes, idempotent atomic payment/stock updates, reconciliation after delivery failures. Handle late payments after stock release explicitly.
- Guest tracking with opaque token and account ownership checks. Configurable WhatsApp product messages.
- Gate: concurrent inventory tests; mocked provider failures and duplicate webhooks; real Paystack test account round trip. Live activation requires explicit approval.

## Phase 5 — Launch preparation

- Full integration tests for authentication, RBAC, CRUD, checkout, webhook replay, orders and customers; responsive/browser accessibility checks.
- Production build, dependency audit, PII/logging review, backup restoration exercise, custom domain/HTTPS and isolated client deployment runbook.
- Never label production-ready until database and external-service checks pass and owner verifies inventory, business details and policies.
