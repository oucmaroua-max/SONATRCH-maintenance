export const STATUS_FROM_API: Record<string, string> = {
  en_attente: 'En attente', en_cours: 'En cours', termine: 'Terminé', en_retard: 'En retard', annule: 'Annulé',
};
export const PRIORITY_FROM_API: Record<string, string> = { critique: 'Critique', haute: 'Haute', normale: 'Normale' };
export const PRIORITY_TO_API: Record<string, string> = { Critique: 'critique', Haute: 'haute', Normale: 'normale' };
export const DECISION_TO_API: Record<string, string> = {
  'Validé': 'valide', 'Validé avec réserves': 'valide_reserves', 'Non validé': 'non_valide',
};

export type ApiWork = {
  id: string; code: string; title: string; unit: string | null; equipment: string | null; permit: string | null;
  descriptionPrevue: string; observation: string | null; priority: string; status: string;
  workerCount: number; progress: number; startDate: string; dueDate: string | null;
  assignedToId: string | null; initiatorId: string; serviceId: string; createdAt: string;
  serviceName: string | null; serviceAbrv: string | null; departmentName: string | null;
  assigneeName: string | null; assigneeNames: string[]; initiatorName: string | null;
};

export const STATUS_TO_API: Record<string, string> = {
  'En attente': 'en_attente', 'En cours': 'en_cours', 'Terminé': 'termine', 'En retard': 'en_retard', 'Annulé': 'annule',
};