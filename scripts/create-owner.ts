import 'dotenv/config';
import { z } from 'zod';
import { database } from '../src/lib/db';
import { hashPassword } from '../src/lib/password';
const input = z.object({ OWNER_EMAIL: z.email().transform(v => v.toLowerCase()), OWNER_PASSWORD: z.string().min(16).max(128) }).parse(process.env);
const db = database();
try {
  const passwordHash = await hashPassword(input.OWNER_PASSWORD);
  await db.$transaction(async tx => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(49180261)`;
    if (await tx.user.count({ where: { role: 'OWNER' } })) throw new Error('An owner already exists. Use owner administration instead.');
    const owner = await tx.user.create({ data: { email: input.OWNER_EMAIL, name: 'Store owner', passwordHash, role: 'OWNER' } });
    await tx.auditLog.create({ data: { actorId: owner.id, action: 'OWNER_BOOTSTRAPPED', entityId: owner.id } });
  });
  console.info('First owner created. Remove OWNER_PASSWORD from your local environment.');
} finally { await db.$disconnect(); }
