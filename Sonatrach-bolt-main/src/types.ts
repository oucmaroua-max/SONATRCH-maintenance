export type WorkStatus = 'En attente' | 'En cours' | 'Terminé' | 'En retard';
export type Priority = 'Critique' | 'Haute' | 'Normale';

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
};
