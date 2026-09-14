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
