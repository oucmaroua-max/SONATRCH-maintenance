import { db } from '@/db/client';
import { users, userPositionHistory } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import type { Role ,  UserStatus } from '@/types/index';

export async function findUserByEmail(email: string) {
  const result = await db.select().from(users).where(eq(users.email, email));
  return result[0] ?? null;
}

export async function findUserByIdentifier(identifier: string) {
  const [u] = await db.select().from(users).where(eq(users.username, identifier));
  return u ?? null;
}

export async function findUserById(id: string) {
  const result = await db.select().from(users).where(eq(users.id, id));
  return result[0] ?? null;
}

export async function findAllUsers() {
  return db.select().from(users).orderBy(users.createdAt);
}

export async function createUser(data: {
  name: string; username: string; email: string; passwordHash: string;
  role: Role | null; sousDirectionAbrv: string | null;
  departementAbrv: string | null; serviceAbrv: string | null; invitedBy: string | null;
}) {
  const [created] = await db.insert(users).values({
    name: data.name,
    username: data.username,
    email: data.email,
    passwordHash: data.passwordHash,
    role: data.role,
    sousDirectionAbrv: data.sousDirectionAbrv,
    departementAbrv: data.departementAbrv,
    serviceAbrv: data.serviceAbrv,
    invitedBy: data.invitedBy,
  }).returning();
  return created;
}

export async function updateUserStatus(id: string, status:  UserStatus, approvedBy?: string) {
  const [updated] = await db.update(users)
    .set({
      status,
      approvedBy: approvedBy ?? sql`approved_by`,
      approvedAt: status === 'active' ? new Date() : sql`approved_at`,
      updatedAt: new Date(),
    })
    .where(eq(users.id, id))
    .returning();
  return updated;
}

export async function updateUserRole(id: string, role: Role, changedBy: string, reason?: string) {
  return db.transaction(async (tx) => {
    const [current] = await tx.select({ role: users.role }).from(users).where(eq(users.id, id));
    if (!current) throw new Error('Utilisateur introuvable');

    const [updated] = await tx.update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();

    await tx.insert(userPositionHistory).values({
      userId: id,
      oldRole: current.role,
      newRole: role,
      changedBy,
      reason: reason ?? null,
    });

    return updated;
  });
}

export async function updateUserHierarchy(
  id: string,
  patch: { sousDirectionAbrv?: string | null; departementAbrv?: string | null; serviceAbrv?: string | null },
  changedBy: string,
  reason?: string,
) {
  return db.transaction(async (tx) => {
    const [old] = await tx.select({
      sousDirectionAbrv: users.sousDirectionAbrv,
      departementAbrv: users.departementAbrv,
      serviceAbrv: users.serviceAbrv,
    }).from(users).where(eq(users.id, id));

    if (!old) throw new Error('Utilisateur introuvable');

    let sousDirectionAbrv = patch.sousDirectionAbrv !== undefined ? patch.sousDirectionAbrv : old.sousDirectionAbrv;
    let departementAbrv = patch.departementAbrv !== undefined ? patch.departementAbrv : old.departementAbrv;
    let serviceAbrv = patch.serviceAbrv !== undefined ? patch.serviceAbrv : old.serviceAbrv;

    if (patch.sousDirectionAbrv !== undefined && patch.sousDirectionAbrv !== old.sousDirectionAbrv) {
      if (patch.departementAbrv === undefined) departementAbrv = null;
      if (patch.serviceAbrv === undefined) serviceAbrv = null;
    }
    if (patch.departementAbrv !== undefined && patch.departementAbrv !== old.departementAbrv) {
      if (patch.serviceAbrv === undefined) serviceAbrv = null;
    }

    const [updated] = await tx.update(users)
      .set({ sousDirectionAbrv, departementAbrv, serviceAbrv, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();

    await tx.insert(userPositionHistory).values({
      userId: id,
      oldSousDirectionAbrv: old.sousDirectionAbrv,
      oldDepartementAbrv: old.departementAbrv,
      oldServiceAbrv: old.serviceAbrv,
      newSousDirectionAbrv: sousDirectionAbrv,
      newDepartementAbrv: departementAbrv,
      newServiceAbrv: serviceAbrv,
      changedBy,
      reason: reason ?? null,
    });

    return updated;
  });
}

export async function findUserWithOrg(id: string) {
  return db.query.users.findFirst({
    where: eq(users.id, id),
    with: {
      sousDirection: true,
      departement: true,
      service: true,
    },
  });
}