export type Role = 'directeur' | 'sous_directeur' | 'chef_departement' | 'chef_service' | 'employe'  ;
export type UserStatus = 'pending' | 'active' | 'inactive' | 'suspended';
export type WorkStatus = 'en_cours' | 'termine' | 'annule' | 'en_attente';
export type InterimStatus = 'active' | 'termine' | 'annule';
export type AdminAction = 'create' | 'update' | 'approve' | 'suspend' | 'reactivate' | 'reset_password';

export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  role: Role | null;
  status: UserStatus;
  sous_direction_abrv: string | null;
  departement_abrv: string | null;
  service_abrv: string | null;
  is_admin: boolean;
  password_hash: string;
  created_at: string;
  updated_at: string;
  invited_by: string | null;
  approved_by: string | null;
  approved_at: string | null;
}

export interface Work {
  id: string;
  initiator_id: string;
  assigned_to_id: string | null;
  responsible_id: string;
  service_id: string;
  description_prevue: string;
  description_realisee: string | null;
  start_date: string;
  end_date: string | null;
  status: WorkStatus;
  worker_count: number;
  observation: string | null;
  finished_at: string | null;
  finished_by: string | null;
}