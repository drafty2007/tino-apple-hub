# Separate store deployment

Do not deploy this Phase 1 foundation for public trading. The remaining phases and acceptance gates are documented in IMPLEMENTATION.md.

For each client create a separate hosting project, PostgreSQL database and restricted database user, image storage configuration, Paystack account and secrets, email provider and domain. Never share credentials or customer records. Use a managed Node-compatible Next.js host and managed PostgreSQL with encrypted transport. Secrets belong in the host's encrypted environment configuration, not Git, content settings, logs or screenshots.

## Deployment procedure after implementation

1. Review and commit generated migrations. Run them against staging and inspect constraints/indexes before production.
2. Configure `DATABASE_URL`, `APP_URL` and service secrets from `.env.example`. Use test Paystack credentials. Do not set live credentials without approval.
3. Install from the committed pnpm lockfile with `pnpm install --frozen-lockfile`, run `pnpm db:generate`, `pnpm test`, `pnpm lint`, `pnpm typecheck`, and `pnpm build`.
4. Back up the database, then run `pnpm db:deploy` from a private deployment job with migration credentials. Runtime credentials should have only required data access, with no schema administration permissions. Do not run `migrate dev` in production.
5. Run the local/private `owner:create` command against the intended store database, then remove bootstrap password variables. Never expose setup as a public endpoint.
6. Add the client's domain in the hosting dashboard and create the DNS records specified by that host. Require a valid HTTPS certificate, redirect HTTP to HTTPS, set APP_URL to the final HTTPS origin, and verify secure cookies. Enable HSTS after verifying HTTPS and all subdomains in scope.
7. Configure payment webhooks only when implemented. Confirm signature validation, retries, duplicate delivery, amount/currency verification and test transactions before launch.

## Operations

Enable automated PostgreSQL point-in-time recovery and encrypted backups with access restricted to the store owner/operators. Set retention based on business requirements and test restoration to an isolated database regularly. Back up Cloudinary assets and store settings. Document recovery ownership and target recovery times per client. Rollback requires a reviewed forward database fix or restoration; never blindly reverse destructive migrations.

Use error monitoring with sensitive request bodies, cookies, addresses and payment details redacted. Alert on webhook failures, failed background jobs, payment/order mismatches, exhausted stock reservations, elevated error rates and database capacity. Log correlation IDs rather than personal details. Schedule expiry cleanup for sessions, reset tokens, rate limits and abandoned reservations once those workflows are implemented.

Business owner must supply verified inventory/pricing, delivery zones, contact/WhatsApp details, approved policy text, real imagery, email delivery credentials, test payment credentials and production approval. No paid services, external deployment or live payment activation has been performed.
