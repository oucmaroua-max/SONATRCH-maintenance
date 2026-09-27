import { Request, Response } from 'express';
import {
  createUser, findAllUsers, findUserByEmail, findUserByIdentifier, findUserById,
  updateUserStatus, updateUserRole, updateUserHierarchy, findUserWithOrg,
} from '@/models/user.model';
import { hashPassword } from '@/utils/hash';
import { db } from '@/db/client';
import { adminAuditLog, userPositionHistory, users } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import type { Role, UserStatus, AdminAction } from '@/types';
import { autoReactivateIfExpired } from '@/models/user.model';

const ROLES: Role[] = ['directeur', 'sous_directeur', 'chef_departement', 'chef_service', 'employe'];
const STATUSES: UserStatus[] = ['pending', 'active', 'inactive', 'suspended'];
const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');

function safe(u: any) {
  const { passwordHash, ...rest } = u;
  return rest;
}

async function logAudit(adminId: string, targetUserId: string, action: AdminAction, details?: string) {
  await db.insert(adminAuditLog).values({ adminId, targetUserId, action, details: details ? { note: details } : null });
}

export async function listUsers(_req: Request, res: Response) {
  res.json((await findAllUsers()).map(safe));
}

export async function getUser(req: Request, res: Response) {
  const user = await findUserWithOrg(req.params.id);
  if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });
  const history = await db.select().from(userPositionHistory)
    .where(eq(userPositionHistory.userId, req.params.id)).orderBy(desc(userPositionHistory.changedAt));
  const audit = await db.select().from(adminAuditLog)
    .where(eq(adminAuditLog.targetUserId, req.params.id)).orderBy(desc(adminAuditLog.createdAt));
  res.json({ user: safe(user), history, audit });
}

export async function createUserHandler(req: Request, res: Response) {
  const name = str(req.body?.name), username = str(req.body?.username), email = str(req.body?.email);
  const password = str(req.body?.password);
  const role = (str(req.body?.role) || null) as Role | null;
  const sousDirectionAbrv = str(req.body?.sousDirectionAbrv) || null;
  const departementAbrv = str(req.body?.departementAbrv) || null;
  const serviceAbrv = str(req.body?.serviceAbrv) || null;
  const isAdmin = Boolean(req.body?.isAdmin);

  if (!name || !username || !email) return res.status(400).json({ error: 'Nom, identifiant et email requis' });
  if (password.length < 8) return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 8 caractères' });
  if (role && !ROLES.includes(role)) return res.status(400).json({ error: 'Rôle invalide' });
  if (await findUserByIdentifier(username)) return res.status(409).json({ error: 'Identifiant déjà utilisé' });
  if (await findUserByEmail(email)) return res.status(409).json({ error: 'Email déjà utilisé' });

  const created = await createUser({
    name, username, email, passwordHash: await hashPassword(password),
    role, sousDirectionAbrv, departementAbrv, serviceAbrv,
    invitedBy: (req as any).auth.userId,
  });

  const [updated] = await db.update(users).set({ isAdmin, updatedAt: new Date() })
    .where(eq(users.id, created.id)).returning();

  await logAudit((req as any).auth.userId, created.id, 'create', `Compte créé (${username})`);
  res.status(201).json({ user: safe(updated ?? created) });
}

export async function updateUserHandler(req: Request, res: Response) {
  const id = req.params.id;
  const current = await findUserById(id);
  if (!current) return res.status(404).json({ error: 'Utilisateur introuvable' });

  const name = req.body?.name !== undefined ? str(req.body.name) : undefined;
  const email = req.body?.email !== undefined ? str(req.body.email) : undefined;
  const isAdmin = req.body?.isAdmin !== undefined ? Boolean(req.body.isAdmin) : undefined;
  const role = req.body?.role !== undefined ? ((str(req.body.role) || null) as Role | null) : undefined;
  const orgChanged = ['sousDirectionAbrv', 'departementAbrv', 'serviceAbrv'].some((k) => req.body?.[k] !== undefined);

  if (role !== undefined && role && !ROLES.includes(role)) return res.status(400).json({ error: 'Rôle invalide' });

  if (name !== undefined || email !== undefined || isAdmin !== undefined) {
    await db.update(users).set({
      ...(name !== undefined ? { name } : {}),
      ...(email !== undefined ? { email } : {}),
      ...(isAdmin !== undefined ? { isAdmin } : {}),
      updatedAt: new Date(),
    }).where(eq(users.id, id));
  }

  if (role !== undefined && role !== current.role) {
    await updateUserRole(id, role as Role, (req as any).auth.userId, str(req.body?.reason) || undefined);
  }

  if (orgChanged) {
    await updateUserHierarchy(id, {
      sousDirectionAbrv: req.body?.sousDirectionAbrv !== undefined ? (str(req.body.sousDirectionAbrv) || null) : undefined,
      departementAbrv: req.body?.departementAbrv !== undefined ? (str(req.body.departementAbrv) || null) : undefined,
      serviceAbrv: req.body?.serviceAbrv !== undefined ? (str(req.body.serviceAbrv) || null) : undefined,
    }, (req as any).auth.userId, str(req.body?.reason) || undefined);
  }

  await logAudit((req as any).auth.userId, id, 'update', 'Informations mises à jour');
  res.json(safe(await findUserById(id)));
}

export async function updateUserStatusHandler(req: Request, res: Response) {
  const id = req.params.id;
  const status = str(req.body?.status) as UserStatus;
  if (!STATUSES.includes(status)) return res.status(400).json({ error: 'Statut invalide' });

  const current = await findUserById(id);
  if (!current) return res.status(404).json({ error: 'Utilisateur introuvable' });

  const adminId = (req as any).auth.userId;
  const updated = await updateUserStatus(id, status, status === 'active' ? adminId : undefined);

  const action: AdminAction = status === 'active' && current.status === 'pending' ? 'approve'
    : status === 'suspended' ? 'suspend'
    : status === 'active' && current.status === 'suspended' ? 'reactivate'
    : 'update';
  await logAudit(adminId, id, action, `Statut : ${current.status} → ${status}`);

  res.json(safe(updated));
}

export async function resetPasswordHandler(req: Request, res: Response) {
  const id = req.params.id;
  const password = str(req.body?.password);
  if (password.length < 8) return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 8 caractères' });

  const current = await findUserById(id);
  if (!current) return res.status(404).json({ error: 'Utilisateur introuvable' });

  const [updated] = await db.update(users)
    .set({ passwordHash: await hashPassword(password), updatedAt: new Date() })
    .where(eq(users.id, id)).returning();

  await logAudit((req as any).auth.userId, id, 'reset_password', 'Mot de passe modifié par un administrateur');
  res.json(safe(updated));
}

export async function declareAbsence(req: Request, res: Response) {
  const userId = (req as any).auth.userId;
  const reason = str(req.body?.reason) || 'Absence';
  const endDate = str(req.body?.endDate);

  if (!endDate) return res.status(400).json({ error: 'La date de retour prévue est requise' });
  const today = new Date().toISOString().slice(0, 10);
  if (endDate < today) return res.status(400).json({ error: 'La date de retour doit être dans le futur' });

  const [updated] = await db.update(users)
    .set({ status: 'inactive', absenceReason: reason, absenceUntil: endDate, updatedAt: new Date() })
    .where(eq(users.id, userId)).returning();

  await db.insert(adminAuditLog).values({
    adminId: userId, targetUserId: userId, action: 'update',
    details: { note: `Absence déclarée (${reason}) jusqu'au ${endDate}` },
  });

  res.json(safe(updated));
}

export async function declareReturn(req: Request, res: Response) {
  const userId = (req as any).auth.userId;
  const [updated] = await db.update(users)
    .set({ status: 'active', absenceUntil: null, absenceReason: null, updatedAt: new Date() })
    .where(eq(users.id, userId)).returning();

  await db.insert(adminAuditLog).values({
    adminId: userId, targetUserId: userId, action: 'update',
    details: { note: "Retour anticipé déclaré par l'utilisateur" },
  });

  res.json(safe(updated));
}

import { verifyPassword } from '@/utils/hash';

export async function changeMyPassword(req: Request, res: Response) {
  const userId = (req as any).auth.userId;
  const currentPassword = str(req.body?.currentPassword);
  const newPassword = str(req.body?.newPassword);

  if (newPassword.length < 8) return res.status(400).json({ error: 'Le nouveau mot de passe doit contenir au moins 8 caractères' });

  const current = await findUserById(userId);
  if (!current) return res.status(404).json({ error: 'Utilisateur introuvable' });
  if (!(await verifyPassword(currentPassword, current.passwordHash)))
    return res.status(401).json({ error: 'Mot de passe actuel incorrect' });

  await db.update(users).set({ passwordHash: await hashPassword(newPassword), updatedAt: new Date() }).where(eq(users.id, userId));
  res.status(204).send();
}

export async function getMyProfile(req: Request, res: Response) {
  const userId = (req as any).auth.userId;
  await autoReactivateIfExpired(userId);
  const user = await findUserWithOrg(userId);
  if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });
  res.json(safe(user));
}