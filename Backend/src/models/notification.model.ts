import { db } from '@/db/client';
import { notifications, users } from '@/db/schema';
import { and, desc, eq } from 'drizzle-orm';

type NotifType =
  | 'work_assigned' | 'interim_requested' | 'interim_approved' | 'interim_rejected'
  | 'interim_created' | 'absence_declared' | 'absence_ended'
  | 'feedback_received' | 'interim_response_needed' | 'interim_accepted' | 'interim_declined';

export async function notify(userId: string, type: NotifType, title: string, message: string, link?: string, entityId?: string) {
  await db.insert(notifications).values({ userId, type, title, message, link: link ?? null, entityId: entityId ?? null });
}

export async function notifyMany(userIds: string[], type: NotifType, title: string, message: string, link?: string, entityId?: string) {
  const uniqueIds = [...new Set(userIds)];
  if (uniqueIds.length === 0) return;
  await db.insert(notifications).values(uniqueIds.map((userId) => ({ userId, type, title, message, link: link ?? null, entityId: entityId ?? null })));
}

export async function notifyAllAdmins(type: NotifType, title: string, message: string, link?: string, entityId?: string, excludeUserId?: string) {
  const admins = await db.select().from(users).where(eq(users.isAdmin, true));
  const recipientIds = admins.map((a) => a.id).filter((id) => id !== excludeUserId);
  await notifyMany(recipientIds, type, title, message, link, entityId);
}

export async function listForUser(userId: string) {
  return db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt)).limit(50);
}

export async function countUnread(userId: string) {
  const rows = await db.select().from(notifications).where(and(eq(notifications.userId, userId), eq(notifications.read, false)));
  return rows.length;
}

export async function markRead(userId: string, id: string) {
  await db.update(notifications).set({ read: true }).where(and(eq(notifications.id, id), eq(notifications.userId, userId)));
}

export async function markAllRead(userId: string) {
  await db.update(notifications).set({ read: true }).where(and(eq(notifications.userId, userId), eq(notifications.read, false)));
}

export async function deleteOne(userId: string, id: string) {
  await db.delete(notifications).where(and(eq(notifications.id, id), eq(notifications.userId, userId)));
}

export async function deleteAll(userId: string) {
  await db.delete(notifications).where(eq(notifications.userId, userId));
}