export type WorkStatus = 'En attente' | 'En cours' | 'Terminé' | 'En retard';
export type Priority = 'Critique' | 'Haute' | 'Normale';

export type UserRole =
  | 'Directeur'
  | 'Sous-directeur'
  | 'Chef de département'
  | 'Chef de service'
  | 'Chef de quart'
  | 'Technicien';

export type FeedbackDecision =
  | 'Validé'
  | 'Validé avec réserves'
  | 'Non validé'
  | 'À reprendre'
  | 'Non conforme HSE';

export const FEEDBACK_DECISIONS: FeedbackDecision[] = [
  'Validé',
  'Validé avec réserves',
  'Non validé',
  'À reprendre',
  'Non conforme HSE',
];

export function isFeedbackApproved(decision: FeedbackDecision) {
  return decision === 'Validé' || decision === 'Validé avec réserves';
}

export type WorkFeedback = {
  author: string;
  role: UserRole;
  decision: FeedbackDecision;
  comment: string;
  date: string;
};

export type WorkOrder = {
  id: string;
  title: string;
  unit: string;
  service: string;
  priority: Priority;
  status: WorkStatus;
  assignee: string;
  startDate: string;
  dueDate: string;
  progress: number;
  description: string;
  observation: string;
  agents: number;
  equipment: string;
  permit: string;
  archived?: boolean;
  feedbacks?: WorkFeedback[];
};
/* ------------------------------------------------------------------ */
/*  User & admin types                                                  */
/* ------------------------------------------------------------------ */

export type Role = 'Directeur' | 'Sous-directeur' | 'Chef de département' | 'Chef de service' | 'Employé';
export type UserStatus = 'pending' | 'active' | 'inactive' | 'suspended';

export const ROLE_LABELS: Record<Role, string> = {
  'Directeur': 'Directeur',
  'Sous-directeur': 'Sous-directeur',
  'Chef de département': 'Chef de département',
  'Chef de service': 'Chef de service',
  'Employé': 'Employé',
};

export const USER_STATUS_LABELS: Record<UserStatus, string> = {
  pending: 'En attente',
  active: 'Actif',
  inactive: 'Inactif',
  suspended: 'Suspendu',
};

export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  role: Role;
  status: UserStatus;
  is_admin: boolean;
  sub_direction: string;
  department: string;
  service: string;
  created_at: string;
  approved_by?: string;
  approved_at?: string;
}

export interface UserPositionHistory {
  id: string;
  user_id: string;
  field: string;
  old_value: string;
  new_value: string;
  changed_by: string;
  changed_at: string;
}

export interface AuditLogEntry {
  id: string;
  target_user_id: string;
  action: string;
  performed_by: string;
  performed_at: string;
  details?: string;
}

/* ------------------------------------------------------------------ */
/*  Organisation types                                                  */
/* ------------------------------------------------------------------ */

export interface SubDirection {
  id: string;
  name: string;
  abrv: string;
}

export interface Department {
  id: string;
  name: string;
  abrv: string;
  sub_direction_id: string;
}

export interface Service {
  id: string;
  name: string;
  abrv: string;
  department_id: string;
}
