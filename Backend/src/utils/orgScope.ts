import { db } from '@/db/client';
import { departements, services } from '@/db/schema';
import type { Role } from '@/types';

export type OrgScope = {
  role: Role | null;
  sousDirectionAbrv: string | null;
  departementAbrv: string | null;
  serviceAbrv: string | null;
};

// Rôle que doit avoir la personne assignée par un donneur d'ordre de ce rôle
export function assignableRoleFor(role: Role | null): Role | null {
  switch (role) {
    case 'directeur': return 'sous_directeur';
    case 'sous_directeur': return 'chef_departement';
    case 'chef_departement': return 'chef_service';
    case 'chef_service': return 'employe';
    default: return null;
  }
}

// Le responsable choisi doit être dans le périmètre du créateur
export function isAssigneeInScope(creator: OrgScope, assignee: OrgScope): boolean {
  switch (creator.role) {
    case 'directeur': return true;
    case 'sous_directeur': return Boolean(creator.sousDirectionAbrv) && assignee.sousDirectionAbrv === creator.sousDirectionAbrv;
    case 'chef_departement': return Boolean(creator.departementAbrv) && assignee.departementAbrv === creator.departementAbrv;
    case 'chef_service': return Boolean(creator.serviceAbrv) && assignee.serviceAbrv === creator.serviceAbrv;
    default: return false;
  }
}

// Abréviations de service visibles pour un périmètre (filtre la liste des travaux)
export async function visibleServiceAbrvs(scope: OrgScope): Promise<string[] | 'all'> {
  if (scope.role === 'directeur') return 'all';

  if (scope.role === 'sous_directeur') {
    if (!scope.sousDirectionAbrv) return [];
    const deps = await db.select().from(departements);
    const depAbrvs = deps.filter((d) => d.sousDirectionAbrv === scope.sousDirectionAbrv).map((d) => d.abrv);
    const svcs = await db.select().from(services);
    return svcs.filter((s) => s.departementAbrv && depAbrvs.includes(s.departementAbrv)).map((s) => s.abrv);
  }

  if (scope.role === 'chef_departement') {
    if (!scope.departementAbrv) return [];
    const svcs = await db.select().from(services);
    return svcs.filter((s) => s.departementAbrv === scope.departementAbrv).map((s) => s.abrv);
  }

  if (scope.role === 'chef_service') {
    return scope.serviceAbrv ? [scope.serviceAbrv] : [];
  }

  return [];
}