ALTER TABLE "ProductVariant" ADD CONSTRAINT "variant_price_nonnegative" CHECK (price >= 0);
ALTER TABLE "ProductVariant" ADD CONSTRAINT "variant_discount_valid" CHECK ("discountPrice" IS NULL OR ("discountPrice" >= 0 AND "discountPrice" < price));
ALTER TABLE "ProductVariant" ADD CONSTRAINT "variant_battery_valid" CHECK ("batteryHealth" IS NULL OR "batteryHealth" BETWEEN 0 AND 100);
ALTER TABLE "Inventory" ADD CONSTRAINT "inventory_valid" CHECK (quantity >= 0 AND reserved >= 0 AND reserved <= quantity);
ALTER TABLE "CartItem" ADD CONSTRAINT "cart_quantity_valid" CHECK (quantity BETWEEN 1 AND 100);
ALTER TABLE "OrderItem" ADD CONSTRAINT "order_item_valid" CHECK (quantity > 0 AND "unitPrice" >= 0);
ALTER TABLE "Order" ADD CONSTRAINT "order_totals_valid" CHECK (subtotal >= 0 AND "deliveryFee" >= 0 AND total = subtotal + "deliveryFee");
ALTER TABLE "Payment" ADD CONSTRAINT "payment_amount_valid" CHECK (amount >= 0);
ALTER TABLE "StoreSettings" ADD CONSTRAINT "delivery_fee_valid" CHECK ("deliveryFee" >= 0);
