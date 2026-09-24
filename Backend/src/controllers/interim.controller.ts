import { Request, Response } from 'express';
import { db } from '@/db/client';
import { interimPeriods, users, adminAuditLog } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { findActiveInterimForDelegating, listInterims, listMyInterims } from '@/models/interim.model';

const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');

async function enrich(rows: any[]) {
  const all = await db.select().from(users);
  const byId = new Map(all.map((u) => [u.id, { id: u.id, name: u.name, role: u.role }]));
  return rows.map((r) => ({
    ...r,
    delegatingUser: byId.get(r.delegatingUserId) ?? null,
    delegateUser: byId.get(r.delegateUserId) ?? null,
  }));
}

export async function list(_req: Request, res: Response) {
  res.json(await enrich(await listInterims()));
}

export async function mine(req: Request, res: Response) {
  res.json(await enrich(await listMyInterims((req as any).auth.userId)));
}

export async function create(req: Request, res: Response) {
  const delegatingUserId = str(req.body?.delegatingUserId);
  const delegateUserId = str(req.body?.delegateUserId);
  const startDate = str(req.body?.startDate);
  const endDate = str(req.body?.endDate);
  const reason = str(req.body?.reason) || null;

  if (!delegatingUserId || !delegateUserId || !startDate || !endDate)
    return res.status(400).json({ error: 'Personne absente, remplaçant et dates requis' });
  if (delegatingUserId === delegateUserId)
    return res.status(400).json({ error: 'Le remplaçant doit être différent de la personne absente' });
  if (await findActiveInterimForDelegating(delegatingUserId))
    return res.status(409).json({ error: 'Cette personne a déjà un intérim actif' });

  const [created] = await db.insert(interimPeriods).values({
    delegatingUserId, delegateUserId, startDate, endDate, reason, status: 'active',
  }).returning();

  await db.insert(adminAuditLog).values({
    adminId: (req as any).auth.userId, targetUserId: delegateUserId, action: 'update',
    details: { note: `Intérim créé (${startDate} → ${endDate})` },
  });

  res.status(201).json(created);
}

export async function end(req: Request, res: Response) {
  const [updated] = await db.update(interimPeriods)
    .set({ status: 'termine', endedAt: new Date(), endedBy: (req as any).auth.userId })
    .where(eq(interimPeriods.id, req.params.id)).returning();
  if (!updated) return res.status(404).json({ error: 'Intérim introuvable' });

  await db.insert(adminAuditLog).values({
    adminId: (req as any).auth.userId, targetUserId: updated.delegateUserId, action: 'update',
    details: { note: `Intérim terminé manuellement` },
  });

  res.json(updated);
}