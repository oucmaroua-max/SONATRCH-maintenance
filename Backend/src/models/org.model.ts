import { db } from '@/db/client';
import { sousDirections, departements, services } from '@/db/schema';
import { eq, asc } from 'drizzle-orm';

export const OrgModel = {
  /* ---------- Lecture simple ---------- */

  getSousDirections: () =>
    db.select().from(sousDirections).orderBy(asc(sousDirections.name)),

  getDepartements: () =>
    db.select().from(departements).orderBy(asc(departements.name)),

  getServices: () =>
    db.select().from(services).orderBy(asc(services.name)),

  /* ---------- Lecture avec relations (utile pour l'admin) ---------- */

  // Arbre complet : sous-directions -> départements -> services, en une requête typée
  getOrgTree: () =>
    db.query.sousDirections.findMany({
      orderBy: asc(sousDirections.name),
      with: {
        // nécessite d'ajouter les relations correspondantes dans schema.ts (voir plus bas)
        departements: {
          orderBy: asc(departements.name),
          with: {
            services: {
              orderBy: asc(services.name),
            },
          },
        },
      },
    }),

  getDepartementsBySousDirection: (sousDirectionAbrv: string) =>
    db.select().from(departements)
      .where(eq(departements.sousDirectionAbrv, sousDirectionAbrv))
      .orderBy(asc(departements.name)),

  getServicesByDepartement: (departementAbrv: string) =>
    db.select().from(services)
      .where(eq(services.departementAbrv, departementAbrv))
      .orderBy(asc(services.name)),

  /* ---------- Création ---------- */

  createSousDirection: async (name: string, abrv: string) => {
    const [created] = await db.insert(sousDirections)
      .values({ name, abrv })
      .returning();
    return created;
  },

  createDepartement: async (name: string, abrv: string, sousDirectionAbrv: string) => {
    const [created] = await db.insert(departements)
      .values({ name, abrv, sousDirectionAbrv })
      .returning();
    return created;
  },

  createService: async (name: string, abrv: string, departementAbrv: string) => {
    const [created] = await db.insert(services)
      .values({ name, abrv, departementAbrv })
      .returning();
    return created;
  },

  /* ---------- Mise à jour ---------- */

  updateSousDirection: async (abrv: string, patch: { name?: string; abrv?: string }) => {
    const [updated] = await db.update(sousDirections)
      .set(patch)
      .where(eq(sousDirections.abrv, abrv))
      .returning();
    return updated ?? null;
  },

  updateDepartement: async (abrv: string, patch: { name?: string; abrv?: string; sousDirectionAbrv?: string }) => {
    const [updated] = await db.update(departements)
      .set(patch)
      .where(eq(departements.abrv, abrv))
      .returning();
    return updated ?? null;
  },

  updateService: async (abrv: string, patch: { name?: string; abrv?: string; departementAbrv?: string }) => {
    const [updated] = await db.update(services)
      .set(patch)
      .where(eq(services.abrv, abrv))
      .returning();
    return updated ?? null;
  },

  /* ---------- Suppression ---------- */
  /* Attention : la FK bloquera la suppression si des enfants existent encore
     (comportement correct, à gérer proprement dans le controller — voir note ci-dessous) */

  deleteSousDirection: (abrv: string) =>
    db.delete(sousDirections).where(eq(sousDirections.abrv, abrv)).returning(),

  deleteDepartement: (abrv: string) =>
    db.delete(departements).where(eq(departements.abrv, abrv)).returning(),

  deleteService: (abrv: string) =>
    db.delete(services).where(eq(services.abrv, abrv)).returning(),
};