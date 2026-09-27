import { Request, Response } from 'express';
import { countUnread, listForUser, markAllRead, markRead } from '@/models/notification.model';

export async function list(req: Request, res: Response) {
  const userId = (req as any).auth.userId;
  const [items, unread] = await Promise.all([listForUser(userId), countUnread(userId)]);
  res.json({ notifications: items, unreadCount: unread });
}

export async function markOneRead(req: Request, res: Response) {
  await markRead((req as any).auth.userId, req.params.id);
  res.status(204).send();
}

export async function markAllReadHandler(req: Request, res: Response) {
  await markAllRead((req as any).auth.userId);
  res.status(204).send();
}