export function cartLineState(variant: { price: number; discountPrice: number | null; inventory: { quantity: number; reserved: number } | null; product: { archived: boolean; demo: boolean } }, quantity: number) {
  const available = Math.max(0, (variant.inventory?.quantity ?? 0) - (variant.inventory?.reserved ?? 0));
  const unitPrice = variant.discountPrice ?? variant.price;
  const active = !variant.product.archived && !variant.product.demo;
  return { available, unitPrice, lineTotal: unitPrice * quantity, valid: active && quantity > 0 && quantity <= available && quantity <= 100 };
}
