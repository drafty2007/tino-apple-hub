# Adding products in TINO APPLE HUB

## One-time private setup

The admin dashboard is `/admin`. It requires a PostgreSQL database and owner account; there is no default password and no login bypass.

1. Install dependencies and copy `.env.example` to `.env`.
2. Configure your own PostgreSQL `DATABASE_URL`. Set `APP_URL` to the browser origin exactly: for the current preview, `http://127.0.0.1:3000`.
3. Run `pnpm db:generate`, `pnpm db:deploy`, then `pnpm db:seed`.
4. Set `OWNER_EMAIL` and a unique `OWNER_PASSWORD` (at least 16 characters) privately in your environment, then run `pnpm owner:create` once. Remove the bootstrap password afterward.
5. Run `pnpm dev`, visit `/login`, sign in, then open `/admin/products`.
6. Local development photo uploads work without external credentials: processed images are stored in `data/uploads/` and referenced in PostgreSQL. Keep that folder with this local database. For production, configure `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY` and `CLOUDINARY_API_SECRET` and restart. Partial Cloudinary configuration disables uploads; production never silently uses local disk. Secrets never go into the browser. This integration uses Cloudinary's authenticated upload API: https://cloudinary.com/documentation/image_upload_api_reference.

## Daily product workflow

1. Choose **Categories** and add a category if needed. A URL slug uses lowercase letters, numbers and hyphens, for example `accessories`. The safe seed already creates iPhones, Samsung Phones, and Accessories.
2. Choose **Products → Add product**.
3. Enter the name, category, and description. New products receive a unique URL automatically. Apple/Samsung branding is inferred from a matching product name or category; other brands can be set later in Edit product.
4. Add one variant for each storage / colour / condition combination. Each variant receives a unique SKU automatically. Enter the price in Ghana cedis, optional discount, total stock and optional battery health. Stock includes reserved units; the server prevents reducing total stock below reserved units.
5. Choose photos before or after the first save. Image formats are detected automatically, with browser-side conversion when available and server-side decoding as a fallback. Up to 10 photos can be selected. The server retains resource bounds of 50 MB per original and 100 megapixels; normal photos are resized automatically. Selected photos appear as previews and can be removed before saving. The first photo is the cover.
6. Click **Save product**. Product details save first, followed by each selected photo with a progress message. The server decodes, rotates, resizes and re-encodes photos as WebP without metadata. If an upload fails, product details and completed uploads remain saved; remaining selected photos stay in the open form for retry. Do not refresh before retrying, because browser-selected files cannot survive a page refresh. Removing a saved photo requires Save product.
7. Check **Published on storefront** when the listing is ready. Check **Featured on homepage** if desired. Save again.
8. Visit **View storefront → View all products**. Featured listings also appear on the homepage. Product details show current prices and a WhatsApp enquiry for each variant. Checkout remains a separate, unfinished feature.

## Editing and archiving

Owners can also choose **Delete → Confirm delete** in the Products list. This permanently removes the product, its variants, inventory and cart entries, and records an audit event. Products with order history or reserved stock cannot be deleted; archive them instead. Staff cannot delete products. Stored image assets are retained for backup/recovery, but their product image records are removed and local image URLs stop serving.

Search products by name, brand or SKU, then choose **Edit product**. Change prices, stock, description or publication state and save. To archive, uncheck **Published on storefront**. Existing variants cannot be deleted because orders may reference them; set stock to zero when discontinued. Orders retain their own price snapshots.

If another administrator changes a product while you edit, the save is rejected. Reload and reapply your changes. Uploading photos also checks the product version. Keep one editor open per product.

## Operational limitations

Real Cloudinary uploads must be verified with staging credentials before production use. Local images for unpublished products require an administrator session; removed image records stop serving immediately. Image removal unlinks the database record and retains the stored asset for recovery. Failed database writes trigger a best-effort deletion of the newly uploaded asset. A process crash or provider/network failure can still leave an unlinked asset; periodically review storage before removing unused assets. Back up `data/uploads/` with the local database. Production uploads should use a dedicated Cloudinary account. The route accepts up to 50 MB plus multipart overhead; browser conversion normally reduces this substantially. Hosting must permit the selected request size. Supported formats depend on the browser and server decoders; a corrupt file or a format neither decoder can open still needs another copy. Animated images use their first frame.

This update implements overview, product management, category creation, image uploads and public catalog integration. It does not implement the complete original order/customer/settings/user/content administration scope or Paystack checkout.


