import 'server-only';
import { cookies } from 'next/headers';
import { randomBytes } from 'node:crypto';
import { redirect } from 'next/navigation';
import { database } from './db';
import { tokenHash } from './password';
const cookieName = process.env.NODE_ENV === 'production' ? '__Host-tino_session' : 'tino_session';
export async function currentUser() {
  const token = (await cookies()).get(cookieName)?.value;
  if (!token) return null;
  const session = await database().session.findUnique({ where: { tokenHash: tokenHash(token) }, include: { user: true } });
  if (!session || session.expiresAt < new Date() || !session.user.active) return null;
  return { id: session.user.id, name: session.user.name, email: session.user.email, role: session.user.role };
}
export async function requireAdmin(ownerOnly = false) {
  const user = await currentUser();
  if (!user) redirect('/login');
  if (user.role === 'CUSTOMER' || (ownerOnly && user.role !== 'OWNER')) throw new Error('Access denied');
  return user;
}
export async function createSession(userId: string) {
  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000);
  await database().session.create({ data: { userId, tokenHash: tokenHash(token), expiresAt } });
  (await cookies()).set(cookieName, token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', expires: expiresAt });
}
export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(cookieName)?.value;
  if (token) await database().session.deleteMany({ where: { tokenHash: tokenHash(token) } });
  jar.delete(cookieName);
}
