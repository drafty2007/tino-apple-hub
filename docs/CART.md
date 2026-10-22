# Shopping cart

Customers can add a single-option product from the collection or choose a specific variant on its detail page. Out-of-stock options are disabled, and the server independently checks publication, stock after reservations and quantity limits. Carts do not reserve inventory.

The header shows the current cart quantity and links to `/cart`. Customers can update quantities, remove items, continue shopping or send a WhatsApp order enquiry. Online payment checkout is still unavailable. The enquiry lists only currently valid cart lines, current database prices, and the product subtotal; shipping and final availability need store confirmation.

Guest carts persist for up to 30 days using a random token in an HTTP-only, SameSite cookie (Secure and `__Host-` prefixed in production). PostgreSQL stores only the token hash, variant identities and quantities. All reads and writes are scoped by that cookie; clients cannot select another cart by ID or supply prices. Customer account cart merging is not implemented.

Quantities are limited to 100 per variant and 50 distinct variants. Add/update operations use serializable transactions and a cart row lock. Expired carts are ignored; periodic cleanup can remove their records later. Price changes appear on the cart from current database values. Unavailable lines stay visible for removal and are excluded from the subtotal; WhatsApp ordering is blocked until all lines are valid.

Validation: unit tests cover prices, discounts, reserved stock, publication rules, malformed quantities, origin checks, additive quantity updates, price tampering and removal. `node scripts/check-cart.mjs` verifies the running local site can add, persist, isolate, update and remove a guest cart, then deletes only its own temporary cart. It needs at least one real published in-stock product and does not change product stock or place an order.
