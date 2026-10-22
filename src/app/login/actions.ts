'use server';
import { z } from 'zod';
import { redirect } from 'next/navigation';
import { database } from '@/lib/db';
import { createSession, destroySession } from '@/lib/auth';
import { assertSameOrigin, rateLimit } from '@/lib/security';
import { verifyPassword, tokenHash } from '@/lib/password';
const schema = z.object({ email: z.email().max(254).transform(v => v.toLowerCase()), password: z.string().min(1).max(128) });
export async function login(form: FormData) {
  await assertSameOrigin();
  const parsed = schema.safeParse(Object.fromEntries(form));
  if (!parsed.success) redirect('/login?error=invalid');
  const { email, password } = parsed.data;
  await rateLimit(`login:${tokenHash(email)}`);
  const user = await database().user.findUnique({ where: { email } });
  // Perform a password derivation even for unknown accounts.
  const valid = await verifyPassword(password, user?.passwordHash ?? `scrypt:${'0'.repeat(64)}:${'0'.repeat(128)}`);
  if (!user || !valid || !user.active) redirect('/login?error=invalid');
  await createSession(user.id);
  redirect(user.role === 'CUSTOMER' ? '/' : '/admin');
}
export async function logout() {
  await assertSameOrigin();
  await destroySession();
  redirect('/login');
}
