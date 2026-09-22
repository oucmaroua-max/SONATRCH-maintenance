import type { Role } from '@/types';

export const ROLE_TO_API: Record<Role, string> = {
  'Directeur': 'directeur',
  'Sous-directeur': 'sous_directeur',
  'Chef de département': 'chef_departement',
  'Chef de service': 'chef_service',
  'Employé': 'employe',
};

const ROLE_FROM_API: Record<string, Role> = {
  directeur: 'Directeur',
  sous_directeur: 'Sous-directeur',
  chef_departement: 'Chef de département',
  chef_service: 'Chef de service',
  employe: 'Employé',
};

export function roleFromApi(role: string | null): Role {
  return (role && ROLE_FROM_API[role]) || 'Employé';
}