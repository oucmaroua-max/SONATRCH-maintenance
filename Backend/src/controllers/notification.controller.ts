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

export async function endEarly(req: Request, res: Response) {
  const userId = (req as any).auth.userId;
  const [interim] = await db.select().from(interimPeriods).where(eq(interimPeriods.id, req.params.id));
  if (!interim) return res.status(404).json({ error: 'Intérim introuvable' });
  if (interim.status !== 'active') return res.status(400).json({ error: "Cet intérim n'est pas actif" });
  if (interim.delegatingUserId !== userId && interim.delegateUserId !== userId)
    return res.status(403).json({ error: "Vous n'êtes pas concerné par cet intérim" });

  const [updated] = await db.update(interimPeriods)
    .set({ status: 'termine', endedAt: new Date(), endedBy: userId })
    .where(eq(interimPeriods.id, req.params.id)).returning();

  const [actor] = await db.select().from(users).where(eq(users.id, userId));
  const otherPartyId = interim.delegatingUserId === userId ? interim.delegateUserId : interim.delegatingUserId;
  const message = `${actor?.name ?? 'Un utilisateur'} a mis fin à l'intérim (${interim.startDate} → ${interim.endDate}) avant son terme.`;

  await notify(otherPartyId, 'interim_ended_early', 'Intérim terminé', message, 'profile', interim.id);
  await notifyAllAdmins('interim_ended_early', 'Intérim terminé avant son terme', message, 'admin-interims', interim.id);

  res.json(updated);
}