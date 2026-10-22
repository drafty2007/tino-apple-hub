import { storeContact } from "../src/lib/store-contact";
import 'dotenv/config';
import { database } from '../src/lib/db';
const db = database();
try {
  await db.storeSettings.upsert({ where: { id: 'store' }, update: {}, create: { id: 'store', whatsapp: storeContact.whatsappNumber, contactPhone: storeContact.phoneInternational } });
  for (const [slug, name] of [['iphones', 'iPhones'], ['samsung', 'Samsung Phones'], ['google-pixel', 'Google Pixel'], ['accessories', 'Accessories']]) {
    await db.category.upsert({ where: { slug }, update: {}, create: { slug, name } });
  }
  console.info('Store settings and categories created. No accounts, inventory, prices, or testimonials seeded.');
} finally { await db.$disconnect(); }


