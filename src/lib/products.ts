import { z } from 'zod';
export const moneyInput = z.string().regex(/^\d{1,7}(\.\d{1,2})?$/, 'Enter a valid GH₵ amount with up to two decimal places.').transform(v => Math.round(Number(v) * 100));
const variant = z.object({
  id: z.string().optional(), sku: z.string().trim().max(80).default(''),
  storage: z.string().trim().max(40), color: z.string().trim().min(1).max(60),
  condition: z.enum(['NEW', 'UK_USED', 'REFURBISHED']),
  batteryHealth: z.union([z.literal(''), z.coerce.number().int().min(0).max(100)]).transform(v => v === '' ? null : v),
  price: moneyInput, discountPrice: z.union([z.literal(''), moneyInput]).transform(v => v === '' ? null : v),
  quantity: z.coerce.number().int().min(0).max(100000),
}).refine(v => v.discountPrice === null || v.discountPrice < v.price, { message: 'Discount must be below the regular price.', path: ['discountPrice'] });
export const productInput = z.object({
  id: z.string().optional(), version: z.string().optional(),
  name: z.string().trim().min(2).max(160), slug: z.union([z.literal(''), z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(200)]).default(''),
  brand: z.string().trim().max(80).default(''), categoryId: z.string().min(1),
  description: z.string().trim().min(10).max(10000), specifications: z.string().max(10000).default(''),
  featured: z.boolean(), archived: z.boolean(),
  variants: z.array(variant).min(1).max(30),
  imageIds: z.array(z.string().min(1)).max(10),
}).superRefine((v, ctx) => {
  const skus = v.variants.map(x => x.sku).filter(Boolean);
  if (new Set(skus).size !== skus.length) ctx.addIssue({ code: 'custom', message: 'Each variant needs a unique SKU.', path: ['variants'] });
  const ids = v.variants.flatMap(x => x.id ? [x.id] : []);
  if (new Set(ids).size !== ids.length) ctx.addIssue({ code: 'custom', message: 'Duplicate variant.', path: ['variants'] });
});
export const formatMoney = (amount: number) => new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS' }).format(amount / 100);
