import { db } from '@/db/client';
import { users, userPositionHistory } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import type { Role } from '@/db/schema';

export async function findUserByEmail(email: string) {
  const result = await db.select().from(users).where(eq(users.email, email));
  return result[0] ?? null;
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

export async function updateUserStatus(id: string, status: 'pending'|'active'|'inactive'|'suspended', approvedBy?: string) {
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