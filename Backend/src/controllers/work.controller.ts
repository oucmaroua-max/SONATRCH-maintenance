import { Request, Response } from 'express';
import { db } from '@/db/client';
import { eq , inArray, desc , sql,and  } from 'drizzle-orm';
import { assignableRoleFor, isAssigneeInScope, visibleServiceAbrvs, type OrgScope } from '@/utils/orgScope';
import { resolveEffectiveScope } from '@/utils/effectiveScope';
import type { Role } from '@/types';
import { works, workFeedback, users, services, departements, workAssignees } from '@/db/schema';
import { notifyMany } from '@/models/notification.model';


const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
const PRIORITIES = ['critique', 'haute', 'normale'];
const STATUSES = ['en_attente', 'en_cours', 'termine', 'en_retard', 'annule'];
const MANAGEMENT_ROLES: Role[] = ['directeur', 'sous_directeur', 'chef_departement', 'chef_service'];

async function nextCode() {
  const year = new Date().getFullYear();
  const all = await db.select().from(works);
  return `OT-${year}-${String(1000 + all.length + 1)}`;
}

const ROLE_DEPTH: Record<string, number> = { directeur: 0, sous_directeur: 1, chef_departement: 2, chef_service: 3, employe: 4 };

async function filterByHierarchy(rows: any[], scope: { role: string | null }, userId: string) {
  if (!scope.role || scope.role === 'directeur') return rows;

  // Un employé ne voit que les travaux où il est directement impliqué
  // (initiateur, assigné principal, ou affecté parmi plusieurs employés).
  if (scope.role === 'employe') {
    const workIds = rows.map((r) => r.id);
    const extraRows = workIds.length ? await db.select().from(workAssignees).where(inArray(workAssignees.workId, workIds)) : [];
    const myExtraWorkIds = new Set(extraRows.filter((r) => r.userId === userId).map((r) => r.workId));
    return rows.filter((r) => r.initiatorId === userId || r.assignedToId === userId || myExtraWorkIds.has(r.id));
  }

  const ownDepth = ROLE_DEPTH[scope.role] ?? 99;
  const assigneeIds = [...new Set(rows.map((r) => r.assignedToId).filter(Boolean))];
  const assigneeRows = assigneeIds.length ? await db.select().from(users).where(inArray(users.id, assigneeIds)) : [];
  const roleById = new Map(assigneeRows.map((u) => [u.id, u.role]));
  return rows.filter((r) => {
    if (r.initiatorId === userId) return true;
    const assigneeRole = r.assignedToId ? roleById.get(r.assignedToId) : null;
    if (!assigneeRole) return true;
    return (ROLE_DEPTH[assigneeRole] ?? 99) >= ownDepth;
  });
}

async function enrichWorks(rows: any[]) {
  if (rows.length === 0) return [];
  const userIds = [...new Set(rows.flatMap((r) => [r.assignedToId, r.initiatorId].filter(Boolean)))];
  const usersRows = userIds.length ? await db.select().from(users).where(inArray(users.id, userIds)) : [];
  const usersById = new Map(usersRows.map((u) => [u.id, u]));

  const serviceIds = [...new Set(rows.map((r) => r.serviceId))];
  const svcRows = serviceIds.length ? await db.select().from(services).where(inArray(services.id, serviceIds)) : [];
  const depAbrvs = [...new Set(svcRows.map((s) => s.departementAbrv).filter(Boolean))] as string[];
  const depRows = depAbrvs.length ? await db.select().from(departements).where(inArray(departements.abrv, depAbrvs)) : [];
  const svcById = new Map(svcRows.map((s) => [s.id, s]));
  const depByAbrv = new Map(depRows.map((d) => [d.abrv, d]));

  const workIds = rows.map((r) => r.id);
  const assigneeRows = workIds.length ? await db.select().from(workAssignees).where(inArray(workAssignees.workId, workIds)) : [];
  const extraUserIds = [...new Set(assigneeRows.map((a) => a.userId))];
  const extraUsers = extraUserIds.length ? await db.select().from(users).where(inArray(users.id, extraUserIds)) : [];
  const extraUsersById = new Map(extraUsers.map((u) => [u.id, u]));
  const assigneesByWork = new Map<string, string[]>();
  assigneeRows.forEach((a) => {
    const name = extraUsersById.get(a.userId)?.name;
    if (!name) return;
    const list = assigneesByWork.get(a.workId) ?? [];
    list.push(name);
    assigneesByWork.set(a.workId, list);
  });

  return rows.map((r) => {
    const svc = svcById.get(r.serviceId);
    const dep = svc?.departementAbrv ? depByAbrv.get(svc.departementAbrv) : null;
    const extraNames = assigneesByWork.get(r.id) ?? [];
    const primaryName = r.assignedToId ? usersById.get(r.assignedToId)?.name ?? null : null;
    const allNames = primaryName && !extraNames.includes(primaryName) ? [primaryName, ...extraNames] : extraNames;
    return {
      ...r,
      serviceName: svc?.name ?? null,
      serviceAbrv: svc?.abrv ?? null,
      departmentName: dep?.name ?? null,
      assigneeName: primaryName,
      assigneeNames: allNames.length ? allNames : primaryName ? [primaryName] : [],
      initiatorName: usersById.get(r.initiatorId)?.name ?? null,
    };
  });
}

async function canAccessWork(scope: OrgScope, work: any): Promise<boolean> {
  const visible = await visibleServiceAbrvs(scope);
  if (visible === 'all') return true;
  const [svc] = await db.select().from(services).where(eq(services.id, work.serviceId));
  return Boolean(svc && visible.includes(svc.abrv));
}

export async function listWorks(req: Request, res: Response) {
  const { scope, actingInterim } = await resolveEffectiveScope(req);
  const visible = await visibleServiceAbrvs(scope);
  const includeArchived = req.query.includeArchived === 'true';

  let rows;
  if (visible === 'all') {
    rows = await db.select().from(works).orderBy(desc(works.createdAt));
  } else if (visible.length === 0) {
    rows = [];
  } else {
    const svcRows = await db.select().from(services).where(inArray(services.abrv, visible));
    const svcIds = svcRows.map((s) => s.id);
    rows = svcIds.length ? await db.select().from(works).where(inArray(works.serviceId, svcIds)).orderBy(desc(works.createdAt)) : [];
  }

  rows = await filterByHierarchy(rows, scope, (req as any).auth.userId);

  rows = await autoMarkLate(rows);
  if (!includeArchived) rows = rows.filter((w) => !w.archived);

  res.json({ works: await enrichWorks(rows), actingInterim });
}

export async function listAssignableUsers(req: Request, res: Response) {
  const { scope } = await resolveEffectiveScope(req);
  const requiredRole = assignableRoleFor(scope.role as Role | null);
  if (!requiredRole) return res.json([]);

  const sousDirectionAbrv = str(req.query.sousDirectionAbrv as string) || null;
  const departementAbrv = str(req.query.departementAbrv as string) || null;
  const serviceAbrv = str(req.query.serviceAbrv as string) || null;

  const all = await db.select().from(users).where(eq(users.role, requiredRole as any));

  const filtered = all.filter((u) => {
    if (!isAssigneeInScope(scope, {
      role: u.role, sousDirectionAbrv: u.sousDirectionAbrv,
      departementAbrv: u.departementAbrv, serviceAbrv: u.serviceAbrv,
    })) return false;

    // Restreint à la branche précise sélectionnée dans le formulaire
    if (requiredRole === 'sous_directeur') return !sousDirectionAbrv || u.sousDirectionAbrv === sousDirectionAbrv;
    if (requiredRole === 'chef_departement') return !departementAbrv || u.departementAbrv === departementAbrv;
    if (requiredRole === 'chef_service') return !serviceAbrv || u.serviceAbrv === serviceAbrv;
    if (requiredRole === 'employe') return !serviceAbrv || u.serviceAbrv === serviceAbrv;
    return true;
  });

  res.json(filtered.map((u) => ({ id: u.id, name: u.name, role: u.role })));
}

export async function getWork(req: Request, res: Response) {
  const [work] = await db.select().from(works).where(eq(works.id, req.params.id));
  if (!work) return res.status(404).json({ error: 'Travail introuvable' });
  await autoMarkLate([work]);
  const [enriched] = await enrichWorks([work]);
  const feedbackRows = await db.select().from(workFeedback).where(eq(workFeedback.workId, work.id)).orderBy(desc(workFeedback.createdAt));
  const authorIds = [...new Set(feedbackRows.map((f) => f.authorId))];
  const authors = authorIds.length ? await db.select().from(users).where(inArray(users.id, authorIds)) : [];
  const authorsById = new Map(authors.map((a) => [a.id, a]));
  const feedbacks = feedbackRows.map((f) => ({ ...f, authorName: authorsById.get(f.authorId)?.name ?? '—', authorRole: authorsById.get(f.authorId)?.role ?? null }));
  res.json({ work: enriched, feedbacks });
}

export async function createWork(req: Request, res: Response) {
  const { scope } = await resolveEffectiveScope(req);
  const requiredAssigneeRole = assignableRoleFor(scope.role as Role | null);
  if (!requiredAssigneeRole) return res.status(403).json({ error: "Votre rôle ne permet pas de créer un ordre de travail" });

  const title = str(req.body?.title);
  const description = str(req.body?.description);
  const serviceAbrv = str(req.body?.serviceAbrv);
  const startDate = str(req.body?.startDate);
  const dueDate = str(req.body?.dueDate) || null;
  const priority = str(req.body?.priority) || 'normale';
  const workerCount = Math.max(1, Number(req.body?.workerCount) || 1);
  const unit = str(req.body?.unit) || null;
  const equipment = str(req.body?.equipment) || null;
  const permit = str(req.body?.permit) || null;
  const observation = str(req.body?.observation) || null;

  // Accepte soit un tableau assignedToIds (multi, réservé à l'affectation d'employés),
  // soit un seul assignedToId (comportement historique, toujours accepté).
  const rawIds: unknown = req.body?.assignedToIds ?? req.body?.assignedToId;
  const assignedToIds = (Array.isArray(rawIds) ? rawIds : [rawIds]).map(str).filter(Boolean);

  if (!title || !description || !serviceAbrv || assignedToIds.length === 0 || !startDate)
    return res.status(400).json({ error: 'Titre, description, service, responsable(s) et date de début requis' });
  if (!PRIORITIES.includes(priority)) return res.status(400).json({ error: 'Priorité invalide' });
  if (requiredAssigneeRole !== 'employe' && assignedToIds.length > 1)
    return res.status(400).json({ error: "Un seul responsable est autorisé à ce niveau hiérarchique" });

  const [service] = await db.select().from(services).where(eq(services.abrv, serviceAbrv));
  if (!service) return res.status(400).json({ error: 'Service introuvable' });

  const assignees = await db.select().from(users).where(inArray(users.id, assignedToIds));
  if (assignees.length !== assignedToIds.length) return res.status(400).json({ error: 'Un ou plusieurs responsables sont introuvables' });

  for (const assignee of assignees) {
    if (assignee.role !== requiredAssigneeRole)
      return res.status(400).json({ error: `Le responsable doit avoir le rôle ${requiredAssigneeRole}` });
    if (!isAssigneeInScope(scope, {
      role: assignee.role, sousDirectionAbrv: assignee.sousDirectionAbrv,
      departementAbrv: assignee.departementAbrv, serviceAbrv: assignee.serviceAbrv,
    })) return res.status(403).json({ error: "Un responsable choisi n'est pas dans votre périmètre" });
  }

  const [created] = await db.insert(works).values({
    code: await nextCode(), title, unit, equipment, permit,
    initiatorId: (req as any).auth.userId, assignedToId: assignedToIds[0], serviceId: service.id,
    descriptionPrevue: description, observation, priority: priority as any,
    status: 'en_attente', workerCount, progress: 0, startDate, dueDate,
  }).returning();

  if (assignedToIds.length > 1) {
    await db.insert(workAssignees).values(assignedToIds.map((userId) => ({ workId: created.id, userId })));
  }

   await notifyMany(
    assignedToIds,
    'work_assigned',
    'Nouveau travail affecté',
    `${title} (${created.code}) vous a été affecté.`,
    `orders/${created.id}`,
  );

  res.status(201).json(created);
}

export async function updateWork(req: Request, res: Response) {
  const userId = (req as any).auth.userId;
  const [current] = await db.select().from(works).where(eq(works.id, req.params.id));
  if (!current) return res.status(404).json({ error: 'Travail introuvable' });
  if (!(await canEditWork(userId, current)))
    return res.status(403).json({ error: "Seuls le responsable ayant confié ce travail et les personnes affectées peuvent le modifier" });

  const patch: Record<string, unknown> = { updatedAt: new Date() };
  if (req.body?.status !== undefined) {
    const status = str(req.body.status);
    if (!STATUSES.includes(status)) return res.status(400).json({ error: 'Statut invalide' });
    patch.status = status;
  }
  if (req.body?.progress !== undefined) patch.progress = Math.min(100, Math.max(0, Number(req.body.progress) || 0));
  if (req.body?.observation !== undefined) patch.observation = str(req.body.observation) || null;
  if (req.body?.description !== undefined) patch.descriptionPrevue = str(req.body.description);
  if (req.body?.dueDate !== undefined) patch.dueDate = str(req.body.dueDate) || null;

  const [updated] = await db.update(works).set(patch).where(eq(works.id, req.params.id)).returning();
  res.json(updated);
}

export async function addFeedback(req: Request, res: Response) {
  const userId = (req as any).auth.userId;
  const [work] = await db.select().from(works).where(eq(works.id, req.params.id));
  if (!work) return res.status(404).json({ error: 'Travail introuvable' });
  if (work.initiatorId !== userId)
    return res.status(403).json({ error: "Seul le responsable qui a confié ce travail peut donner un avis" });

  const decision = str(req.body?.decision);
  const comment = str(req.body?.comment);
  const DECISIONS = ['valide', 'valide_reserves', 'non_valide', 'a_reprendre', 'non_conforme_hse'];
  if (!DECISIONS.includes(decision) || !comment) return res.status(400).json({ error: 'Décision et commentaire requis' });

  const [created] = await db.insert(workFeedback).values({
    workId: work.id, authorId: userId, decision: decision as any, comment,
  }).returning();

  const approved = decision === 'valide' || decision === 'valide_reserves';
  await db.update(works).set({
    status: approved ? 'termine' : 'en_cours',
    progress: approved ? 100 : Math.min(work.progress ?? 100, 80),
    archived: approved,
    updatedAt: new Date(),
  }).where(eq(works.id, work.id));

  const extraRows = await db.select().from(workAssignees).where(eq(workAssignees.workId, work.id));
  const recipients = [...new Set([work.assignedToId, ...extraRows.map((r) => r.userId)].filter(Boolean))] as string[];

  const DECISION_LABELS: Record<string, string> = {
    valide: 'Validé', valide_reserves: 'Validé avec réserves', non_valide: 'Non validé',
    a_reprendre: 'À reprendre', non_conforme_hse: 'Non conforme HSE',
  };
  await notifyMany(
    recipients,
    'feedback_received',
    approved ? 'Votre travail a été validé' : 'Retour sur votre travail',
    `${work.title} (${work.code}) — Décision : ${DECISION_LABELS[decision]}. ${comment}`,
    `orders/${work.id}`,
  );

  res.status(201).json(created);
}

async function autoMarkLate(rows: any[]) {
  const today = new Date().toISOString().slice(0, 10);
  const overdue = rows.filter((w) => w.dueDate && w.dueDate < today && (w.status === 'en_attente' || w.status === 'en_cours'));
  if (overdue.length > 0) {
    await Promise.all(overdue.map((w) =>
      db.update(works).set({ status: 'en_retard', updatedAt: new Date() }).where(eq(works.id, w.id))
    ));
    overdue.forEach((w) => { w.status = 'en_retard'; });
  }
  return rows;
}

async function canEditWork(userId: string, work: any) {
  if (work.initiatorId === userId || work.assignedToId === userId) return true;
  const extra = await db.select().from(workAssignees)
    .where(and(eq(workAssignees.workId, work.id), eq(workAssignees.userId, userId)));
  return extra.length > 0;
}