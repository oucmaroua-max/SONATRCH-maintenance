import { Request, Response } from 'express';
import { db } from '@/db/client';
import { interimPeriods, users, adminAuditLog } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { findActiveInterimForDelegating, listInterims, listMyInterims } from '@/models/interim.model';
import { notify, notifyAllAdmins } from '@/models/notification.model';
import { assignableRoleFor, isAssigneeInScope } from '@/utils/orgScope';
import { resolveEffectiveScope } from '@/utils/effectiveScope';
import type { Role } from '@/types';

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

// Création directe par un admin : reste active immédiatement, inchangé
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
    return res.status(409).json({ error: 'Cette personne a déjà un intérim actif ou en attente' });

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
    `Vous remplacez un collègue du ${startDate} au ${endDate}.`, 'profile', created.id,
  );

  res.status(201).json(created);
}

// L'utilisateur propose lui-même un intérim : sélection du remplaçant restreinte
// hiérarchiquement (même logique que l'affectation des travaux), puis attente
// de l'acceptation du remplaçant (l'admin est seulement informé).
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

  const { scope } = await resolveEffectiveScope(req);
  const requiredRole = assignableRoleFor(scope.role as Role | null);
  if (!requiredRole) return res.status(403).json({ error: "Votre rôle ne permet pas de déclarer un intérim" });

  const [delegate] = await db.select().from(users).where(eq(users.id, delegateUserId));
  if (!delegate) return res.status(400).json({ error: 'Remplaçant introuvable' });
  if (delegate.role !== requiredRole)
    return res.status(400).json({ error: `Le remplaçant doit avoir le rôle ${requiredRole}` });
  if (!isAssigneeInScope(scope, {
    role: delegate.role, sousDirectionAbrv: delegate.sousDirectionAbrv,
    departementAbrv: delegate.departementAbrv, serviceAbrv: delegate.serviceAbrv,
  })) return res.status(403).json({ error: "Ce remplaçant n'est pas dans votre périmètre" });

  const [created] = await db.insert(interimPeriods).values({
    delegatingUserId, delegateUserId, startDate, endDate, reason,
    status: 'en_attente', requestedBy: delegatingUserId,
  }).returning();

  const [delegating] = await db.select().from(users).where(eq(users.id, delegatingUserId));

  await notifyAllAdmins(
    'interim_requested', "Nouvelle demande d'intérim",
    `${delegating?.name ?? 'Un utilisateur'} propose ${delegate.name} comme remplaçant (${startDate} → ${endDate}).`,
    'admin-interims', created.id,
  );

  await notify(
  delegateUserId, 'interim_response_needed', "Demande d'intérim à valider",
  `${delegating?.name ?? 'Un collègue'} vous propose comme remplaçant du ${startDate} au ${endDate}${reason ? ` (${reason})` : ''}.`,
  'profile', created.id,
);

  res.status(201).json(created);
}

/* Réponse du remplaçant désigné
export async function acceptByDelegate(req: Request, res: Response) {
  const userId = (req as any).auth.userId;
  const [interim] = await db.select().from(interimPeriods).where(eq(interimPeriods.id, req.params.id));
  if (!interim) return res.status(404).json({ error: 'Demande introuvable' });
  if (interim.delegateUserId !== userId) return res.status(403).json({ error: "Cette demande ne vous concerne pas" });
  if (interim.status !== 'en_attente') return res.status(400).json({ error: 'Cette demande a déjà été traitée' });

  const [updated] = await db.update(interimPeriods)
    .set({ status: 'active', approvedBy: userId })
    .where(eq(interimPeriods.id, req.params.id)).returning();

  const [delegate] = await db.select().from(users).where(eq(users.id, userId));
  const message = `${delegate?.name ?? 'Le remplaçant'} a accepté l'intérim (${interim.startDate} → ${interim.endDate}).`;

  await notifyAllAdmins('interim_accepted', 'Intérim accepté', message, 'admin-interims', interim.id);
  await notify(interim.delegatingUserId, 'interim_accepted', 'Votre demande d\'intérim a été acceptée', message, undefined, interim.id);

  res.json(updated);
}

export async function declineByDelegate(req: Request, res: Response) {
  const userId = (req as any).auth.userId;
  const [interim] = await db.select().from(interimPeriods).where(eq(interimPeriods.id, req.params.id));
  if (!interim) return res.status(404).json({ error: 'Demande introuvable' });
  if (interim.delegateUserId !== userId) return res.status(403).json({ error: "Cette demande ne vous concerne pas" });
  if (interim.status !== 'en_attente') return res.status(400).json({ error: 'Cette demande a déjà été traitée' });

  const [updated] = await db.update(interimPeriods)
    .set({ status: 'refuse' })
    .where(eq(interimPeriods.id, req.params.id)).returning();

  const [delegate] = await db.select().from(users).where(eq(users.id, userId));
  const message = `${delegate?.name ?? 'Le remplaçant'} a refusé l'intérim (${interim.startDate} → ${interim.endDate}).`;

  await notifyAllAdmins('interim_declined', 'Intérim refusé', message, 'admin-interims', interim.id);
  await notify(interim.delegatingUserId, 'interim_declined', 'Votre demande d\'intérim a été refusée', message, undefined, interim.id);

  res.json(updated);
}*/

export async function acceptByDelegate(req: Request, res: Response) {
  const userId = (req as any).auth.userId;
  const [interim] = await db.select().from(interimPeriods).where(eq(interimPeriods.id, req.params.id));
  if (!interim) return res.status(404).json({ error: 'Demande introuvable' });
  if (interim.delegateUserId !== userId)
    return res.status(403).json({ error: "Cette demande ne vous concerne pas" });

  // ✅ Idempotent : déjà accepté → on renvoie OK sans rien refaire
  if (interim.status === 'active') return res.json(interim);
  if (interim.status !== 'en_attente')
    return res.status(409).json({ error: `Impossible : la demande est déjà "${interim.status}"` });

  const [updated] = await db.update(interimPeriods)
    .set({ status: 'active', approvedBy: userId })
    .where(eq(interimPeriods.id, req.params.id)).returning();

  const [delegate] = await db.select().from(users).where(eq(users.id, userId));
  const message = `${delegate?.name ?? 'Le remplaçant'} a accepté l'intérim (${interim.startDate} → ${interim.endDate}).`;

  await notifyAllAdmins('interim_accepted', 'Intérim accepté', message, 'admin-interims', interim.id);
  await notify(interim.delegatingUserId, 'interim_accepted', "Votre demande d'intérim a été acceptée", message, 'profile', interim.id);

  res.json(updated);
}

export async function declineByDelegate(req: Request, res: Response) {
  const userId = (req as any).auth.userId;
  const [interim] = await db.select().from(interimPeriods).where(eq(interimPeriods.id, req.params.id));
  if (!interim) return res.status(404).json({ error: 'Demande introuvable' });
  if (interim.delegateUserId !== userId)
    return res.status(403).json({ error: "Cette demande ne vous concerne pas" });

  if (interim.status === 'refuse') return res.json(interim);
  if (interim.status !== 'en_attente')
    return res.status(409).json({ error: `Impossible : la demande est déjà "${interim.status}"` });

  const [updated] = await db.update(interimPeriods)
    .set({ status: 'refuse' })
    .where(eq(interimPeriods.id, req.params.id)).returning();

  const [delegate] = await db.select().from(users).where(eq(users.id, userId));
  const message = `${delegate?.name ?? 'Le remplaçant'} a refusé l'intérim (${interim.startDate} → ${interim.endDate}).`;

  await notifyAllAdmins('interim_declined', 'Intérim refusé', message, 'admin-interims', interim.id);
  await notify(interim.delegatingUserId, 'interim_declined', "Votre demande d'intérim a été refusée", message, 'profile', interim.id);

  res.json(updated);
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

// Conservé pour un contrôle manuel de secours par l'admin (fallback)
export async function approve(req: Request, res: Response) {
  const [interim] = await db.select().from(interimPeriods).where(eq(interimPeriods.id, req.params.id));
  if (!interim) return res.status(404).json({ error: 'Demande introuvable' });
  if (interim.status !== 'en_attente') return res.status(400).json({ error: 'Cette demande a déjà été traitée' });

  const [updated] = await db.update(interimPeriods)
    .set({ status: 'active', approvedBy: (req as any).auth.userId })
    .where(eq(interimPeriods.id, req.params.id)).returning();

  await notify(interim.delegateUserId, 'interim_approved', "Intérim approuvé par l'administrateur",
    `Votre intérim du ${interim.startDate} au ${interim.endDate} a été validé.`, 'profile', interim.id);

  res.json(updated);
}

export async function reject(req: Request, res: Response) {
  const [interim] = await db.select().from(interimPeriods).where(eq(interimPeriods.id, req.params.id));
  if (!interim) return res.status(404).json({ error: 'Demande introuvable' });

  const [updated] = await db.update(interimPeriods)
    .set({ status: 'refuse' })
    .where(eq(interimPeriods.id, req.params.id)).returning();

  await notify(interim.delegatingUserId, 'interim_rejected', "Demande d'intérim refusée par l'administrateur",
    `Votre demande d'intérim (${interim.startDate} → ${interim.endDate}) a été refusée.`, 'profile', interim.id);

  res.json(updated);
}