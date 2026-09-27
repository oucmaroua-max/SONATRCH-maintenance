import { Request, Response } from 'express';
import { db } from '@/db/client';
import { interimPeriods, users, adminAuditLog } from '@/db/schema';
import { eq , sql} from 'drizzle-orm';
import { findActiveInterimForDelegating, listInterims, listMyInterims } from '@/models/interim.model';
import { notify, notifyAllAdmins } from '@/models/notification.model';

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
    approvedBy: (req as any).auth.userId,
  }).returning();

  await db.insert(adminAuditLog).values({
    adminId: (req as any).auth.userId, targetUserId: delegateUserId, action: 'update',
    details: { note: `Intérim créé (${startDate} → ${endDate})` },
  });

    await notify(
    delegateUserId, 'interim_created', 'Vous avez été désigné remplaçant',
    `Vous remplacez un collègue du ${startDate} au ${endDate}.`, 'profile',
  );

  res.status(201).json(created);
}

// L'utilisateur (responsable) propose lui-même un intérim → statut "en_attente"
export async function requestByUser(req: Request, res: Response) {
  const delegatingUserId = (req as any).auth.userId;
  const delegateUserId = str(req.body?.delegateUserId);
  const startDate = str(req.body?.startDate);
  const endDate = str(req.body?.endDate);
  const reason = str(req.body?.reason) || null;

  if (!delegateUserId || !startDate || !endDate)
    return res.status(400).json({ error: 'Remplaçant et dates requis' });
  if (delegatingUserId === delegateUserId)
    return res.status(400).json({ error: 'Le remplaçant doit être différent de vous-même' });
  if (await findActiveInterimForDelegating(delegatingUserId))
    return res.status(409).json({ error: 'Vous avez déjà un intérim actif ou en attente' });

  const [created] = await db.insert(interimPeriods).values({
    delegatingUserId, delegateUserId, startDate, endDate, reason,
    status: 'en_attente', requestedBy: delegatingUserId,
  }).returning();

    await notifyAllAdmins(
    'interim_requested', 'Nouvelle demande d\'intérim',
    `Une demande d'intérim a été soumise et attend votre validation.`, 'admin-interims',
  );

  res.status(201).json(created);
}

export async function approve(req: Request, res: Response) {
  const [interim] = await db.select().from(interimPeriods).where(eq(interimPeriods.id, req.params.id));
  if (!interim) return res.status(404).json({ error: 'Demande introuvable' });
  if (interim.status !== 'en_attente') return res.status(400).json({ error: 'Cette demande a déjà été traitée' });

  const [updated] = await db.update(interimPeriods)
    .set({ status: 'active', approvedBy: (req as any).auth.userId })
    .where(eq(interimPeriods.id, req.params.id)).returning();

  await db.insert(adminAuditLog).values({
    adminId: (req as any).auth.userId, targetUserId: interim.delegateUserId, action: 'update',
    details: { note: `Demande d'intérim approuvée` },
  });

    await notify(
    interim.delegateUserId, 'interim_approved', 'Intérim approuvé',
    `Votre intérim du ${interim.startDate} au ${interim.endDate} a été validé.`, 'profile',
  );

  res.json(updated);
}

export async function reject(req: Request, res: Response) {
  const [interim] = await db.select().from(interimPeriods).where(eq(interimPeriods.id, req.params.id));
  if (!interim) return res.status(404).json({ error: 'Demande introuvable' });

  const [updated] = await db.update(interimPeriods)
    .set({ status: 'refuse' })
    .where(eq(interimPeriods.id, req.params.id)).returning();

  await notify(
    interim.delegatingUserId, 'interim_rejected', 'Demande d\'intérim refusée',
    `Votre demande d'intérim (${interim.startDate} → ${interim.endDate}) a été refusée par l'administrateur.`, 'profile',
  );

  res.json(updated);
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