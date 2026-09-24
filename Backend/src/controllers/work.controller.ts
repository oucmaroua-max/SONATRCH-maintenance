import { Request, Response } from 'express';
import { db } from '@/db/client';
import { works, workFeedback, users, services, departements } from '@/db/schema';
import { eq , inArray, desc , sql  } from 'drizzle-orm';
import { assignableRoleFor, isAssigneeInScope, visibleServiceAbrvs, type OrgScope } from '@/utils/orgScope';
import { resolveEffectiveScope } from '@/utils/effectiveScope';
import type { Role } from '@/types';

const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
const PRIORITIES = ['critique', 'haute', 'normale'];
const STATUSES = ['en_attente', 'en_cours', 'termine', 'en_retard', 'annule'];
const MANAGEMENT_ROLES: Role[] = ['directeur', 'sous_directeur', 'chef_departement', 'chef_service'];

async function nextCode() {
  const year = new Date().getFullYear();
  const all = await db.select().from(works);
  return `OT-${year}-${String(1000 + all.length + 1)}`;
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

  return rows.map((r) => {
    const svc = svcById.get(r.serviceId);
    const dep = svc?.departementAbrv ? depByAbrv.get(svc.departementAbrv) : null;
    return {
      ...r,
      serviceName: svc?.name ?? null,
      serviceAbrv: svc?.abrv ?? null,
      departmentName: dep?.name ?? null,
      assigneeName: r.assignedToId ? usersById.get(r.assignedToId)?.name ?? null : null,
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
  const assignedToId = str(req.body?.assignedToId);
  const startDate = str(req.body?.startDate);
  const dueDate = str(req.body?.dueDate) || null;
  const priority = str(req.body?.priority) || 'normale';
  const workerCount = Math.max(1, Number(req.body?.workerCount) || 1);
  const unit = str(req.body?.unit) || null;
  const equipment = str(req.body?.equipment) || null;
  const permit = str(req.body?.permit) || null;
  const observation = str(req.body?.observation) || null;

  if (!title || !description || !serviceAbrv || !assignedToId || !startDate)
    return res.status(400).json({ error: 'Titre, description, service, responsable et date de début requis' });
  if (!PRIORITIES.includes(priority)) return res.status(400).json({ error: 'Priorité invalide' });

  const [service] = await db.select().from(services).where(eq(services.abrv, serviceAbrv));
  if (!service) return res.status(400).json({ error: 'Service introuvable' });

  const [assignee] = await db.select().from(users).where(eq(users.id, assignedToId));
  if (!assignee) return res.status(400).json({ error: 'Responsable introuvable' });
  if (assignee.role !== requiredAssigneeRole)
    return res.status(400).json({ error: `Le responsable doit avoir le rôle ${requiredAssigneeRole}` });
  if (!isAssigneeInScope(scope, {
    role: assignee.role, sousDirectionAbrv: assignee.sousDirectionAbrv,
    departementAbrv: assignee.departementAbrv, serviceAbrv: assignee.serviceAbrv,
  })) return res.status(403).json({ error: "Ce responsable n'est pas dans votre périmètre" });

  const [created] = await db.insert(works).values({
    code: await nextCode(), title, unit, equipment, permit,
    initiatorId: (req as any).auth.userId, assignedToId, serviceId: service.id,
    descriptionPrevue: description, observation, priority: priority as any,
    status: 'en_attente', workerCount, progress: 0, startDate, dueDate,
  }).returning();

  res.status(201).json(created);
}

export async function updateWork(req: Request, res: Response) {
  const { scope } = await resolveEffectiveScope(req);
  const [current] = await db.select().from(works).where(eq(works.id, req.params.id));
  if (!current) return res.status(404).json({ error: 'Travail introuvable' });
  if (!(await canAccessWork(scope, current))) return res.status(403).json({ error: 'Hors de votre périmètre' });

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
  const { scope } = await resolveEffectiveScope(req);
  if (!scope.role || !MANAGEMENT_ROLES.includes(scope.role))
    return res.status(403).json({ error: 'Rôle non autorisé à donner un avis' });

  const [work] = await db.select().from(works).where(eq(works.id, req.params.id));
  if (!work) return res.status(404).json({ error: 'Travail introuvable' });
  if (!(await canAccessWork(scope, work))) return res.status(403).json({ error: 'Hors de votre périmètre' });

  const decision = str(req.body?.decision);
  const comment = str(req.body?.comment);
  const DECISIONS = ['valide', 'valide_reserves', 'non_valide', 'a_reprendre', 'non_conforme_hse'];
  if (!DECISIONS.includes(decision) || !comment) return res.status(400).json({ error: 'Décision et commentaire requis' });

  const [created] = await db.insert(workFeedback).values({
    workId: work.id, authorId: (req as any).auth.userId, decision: decision as any, comment,
  }).returning();

  const approved = decision === 'valide' || decision === 'valide_reserves';
  await db.update(works).set({
    status: approved ? 'termine' : 'en_cours',
    progress: approved ? 100 : Math.min(work.progress ?? 100, 80),
    updatedAt: new Date(),
  }).where(eq(works.id, work.id));

  res.status(201).json(created);
}