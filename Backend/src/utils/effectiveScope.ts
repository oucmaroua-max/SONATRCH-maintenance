import { Request } from 'express';
import { db } from '@/db/client';
import { interimPeriods, users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import type { OrgScope } from './orgScope';

export async function resolveEffectiveScope(req: Request): Promise<{ scope: OrgScope; actingInterim: { id: string; delegatingName: string } | null }> {
  const auth = (req as any).auth;
  const interimId = req.headers['x-acting-interim'] as string | undefined;

  if (interimId) {
    const [interim] = await db.select().from(interimPeriods).where(eq(interimPeriods.id, interimId));
    if (interim && interim.status === 'active' && interim.delegateUserId === auth.userId) {
      const [delegating] = await db.select().from(users).where(eq(users.id, interim.delegatingUserId));
      if (delegating) {
        return {
          scope: {
            role: delegating.role, sousDirectionAbrv: delegating.sousDirectionAbrv,
            departementAbrv: delegating.departementAbrv, serviceAbrv: delegating.serviceAbrv,
          },
          actingInterim: { id: interim.id, delegatingName: delegating.name },
        };
      }
    }
  }

  const [me] = await db.select().from(users).where(eq(users.id, auth.userId));
  return {
    scope: {
      role: me?.role ?? null, sousDirectionAbrv: me?.sousDirectionAbrv ?? null,
      departementAbrv: me?.departementAbrv ?? null, serviceAbrv: me?.serviceAbrv ?? null,
    },
    actingInterim: null,
  };
}