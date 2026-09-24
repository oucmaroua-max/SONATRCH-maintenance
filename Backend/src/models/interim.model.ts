import { db } from '@/db/client';
import { interimPeriods } from '@/db/schema';
import { and, eq } from 'drizzle-orm';

export async function findActiveInterimForDelegating(delegatingUserId: string) {
  const rows = await db.select().from(interimPeriods)
    .where(and(eq(interimPeriods.delegatingUserId, delegatingUserId), eq(interimPeriods.status, 'active')));
  return rows[0] ?? null;
}

export async function listInterims() {
  return db.select().from(interimPeriods).orderBy(interimPeriods.createdAt);
}

export async function listMyInterims(userId: string) {
  const all = await db.select().from(interimPeriods);
  return all.filter((i) => i.delegateUserId === userId || i.delegatingUserId === userId);
}