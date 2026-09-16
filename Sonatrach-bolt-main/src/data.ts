//import type { WorkOrder } from '@/types';
import type { AuditLogEntry, Department, Service, SubDirection, User, UserPositionHistory, WorkOrder } from '@/types';

export const workOrders: WorkOrder[] = [
  {
    id: 'OT-2026-0847',
    title: 'Inspection vibratoire de la pompe P-101A',
    unit: 'Topping / Train 1',
    service: 'Machines tournantes',
    priority: 'Haute',
    status: 'En cours',
    assignee: 'K. Hamidi',
    startDate: '08 sept. 2026',
    dueDate: '10 sept. 2026',
    progress: 68,
    equipment: 'P-101A',
    permit: 'PT-2026-118',
    agents: 2,
    description: 'Analyse vibratoire complète de la pompe P-101A (palier avant / palier arrière) suite à une hausse d’amplitude observée sur le quart du matin. Contrôler l’alignement, l’état des roulements et le graissage.',
    observation: 'Intervention sous Permis de Travail. Consignation électrique et isolation process à confirmer avec le chef de quart avant démontage.',
  },
  {
    id: 'OT-2026-0846',
    title: 'Remplacement joint vanne XV-204',
    unit: 'Hydrotraitement',
    service: 'Mécanique',
    priority: 'Critique',
    status: 'En attente',
    assignee: 'S. Belkacem',
    startDate: '09 sept. 2026',
    dueDate: '09 sept. 2026',
    progress: 0,
    equipment: 'XV-204',
    permit: 'PT-2026-112',
    agents: 3,
    description: 'Fuite au joint de la vanne XV-204. Remplacer le joint, contrôler les portées de bride et effectuer un test d’étanchéité après remontage.',
    observation: 'Pièce de rechange disponible au magasin atelier mécanique. Zone ATEX : outillage antidéflagrant obligatoire.',
  },
  {
    id: 'OT-2026-0842',
    title: 'Calibration transmetteurs pression',
    unit: 'Reforming catalytique',
    service: 'Instrumentation',
    priority: 'Normale',
    status: 'En cours',
    assignee: 'M. Zerrouki',
    startDate: '07 sept. 2026',
    dueDate: '12 sept. 2026',
    progress: 42,
    equipment: 'PT-331 / PT-334 / PT-338',
    permit: 'PT-2026-109',
    agents: 2,
    description: 'Étalonnage des transmetteurs de pression PT-331, PT-334 et PT-338. Vérifier la boucle 4-20 mA, ajuster le zéro et consigner les écarts dans le rapport d’instrumentation.',
    observation: 'Calibreur et manomètre étalon à retirer au laboratoire instrumentation avant 07:30.',
  },
  {
    id: 'OT-2026-0838',
    title: 'Contrôle thermographique armoire HT',
    unit: 'Utilités / Électricité',
    service: 'Électricité',
    priority: 'Haute',
    status: 'Terminé',
    assignee: 'A. Merouane',
    startDate: '05 sept. 2026',
    dueDate: '07 sept. 2026',
    progress: 100,
    equipment: 'Armoire HT-04',
    permit: 'PT-2026-101',
    agents: 2,
    description: 'Inspection thermographique de l’armoire HT-04. Relever les points chauds sur jeux de barres, disjoncteurs et raccordements, puis comparer aux seuils de consigne.',
    observation: 'Intervention clôturée. Rapport joint au dossier OT. Aucune anomalie critique détectée.',
  },
  {
    id: 'OT-2026-0831',
    title: 'Révision préventive compresseur C-04',
    unit: 'Utilités',
    service: 'Machines tournantes',
    priority: 'Normale',
    status: 'En retard',
    assignee: 'Y. Djebbar',
    startDate: '02 sept. 2026',
    dueDate: '08 sept. 2026',
    progress: 76,
    equipment: 'C-04',
    permit: 'PT-2026-097',
    agents: 4,
    description: 'Révision préventive du compresseur C-04 : contrôle des soupapes, vidange d’huile, inspection des filtres et serrage des liaisons process.',
    observation: 'Retard dû à l’indisponibilité d’un joint d’huile. Livraison magasin prévue le 11 sept. 2026.',
  },
  {
    id: 'OT-2026-0827',
    title: 'Mise en conformité ligne vapeur',
    unit: 'Parc utilités',
    service: 'Tuyauterie',
    priority: 'Haute',
    status: 'Terminé',
    assignee: 'Équipe quart A',
    startDate: '01 sept. 2026',
    dueDate: '06 sept. 2026',
    progress: 100,
    equipment: 'Ligne vapeur LV-12',
    permit: 'PT-2026-088',
    agents: 5,
    description: 'Mise en conformité de la ligne vapeur LV-12 : remplacement des supports dégradés, reprise d’isolation et contrôle visuel des soudures.',
    observation: 'Travaux réceptionnés par le superviseur utilités. Isolation thermique refaite sur 18 ml.',
  },
];

export const activity = [
  { time: '09:42', title: 'OT-2026-0847 mis à jour', detail: 'Progression portée à 68% · K. Hamidi', tone: 'orange' },
  { time: '09:18', title: 'Permis de travail validé', detail: 'Hydrotraitement · PT-2026-112', tone: 'green' },
  { time: '08:55', title: 'Nouvelle anomalie signalée', detail: 'Vibration anormale · Pompe P-101A', tone: 'red' },
  { time: '08:31', title: 'Intervention clôturée', detail: 'Armoire HT · A. Merouane', tone: 'blue' },
];

/* ------------------------------------------------------------------ */
/*  Organisation                                                        */
/* ------------------------------------------------------------------ */

export const subDirections: SubDirection[] = [
  { id: 'sd-1', name: 'Sous-direction Maintenance', abrv: 'SDM' },
  { id: 'sd-2', name: 'Sous-direction Exploitation', abrv: 'SDE' },
  { id: 'sd-3', name: "Sous-direction HSE", abrv: 'SDH' },
];

export const departments: Department[] = [
  { id: 'dep-1', name: 'Département Mécanique', abrv: 'MEC', sub_direction_id: 'sd-1' },
  { id: 'dep-2', name: 'Département Instrumentation', abrv: 'INS', sub_direction_id: 'sd-1' },
  { id: 'dep-3', name: 'Département Procédé', abrv: 'PRC', sub_direction_id: 'sd-2' },
  { id: 'dep-4', name: 'Département Sécurité', abrv: 'SEC', sub_direction_id: 'sd-3' },
];

export const services: Service[] = [
  { id: 'svc-1', name: 'Service Rotatives', abrv: 'ROT', department_id: 'dep-1' },
  { id: 'svc-2', name: 'Service Statiques', abrv: 'STT', department_id: 'dep-1' },
  { id: 'svc-3', name: 'Service Régulation', abrv: 'REG', department_id: 'dep-2' },
  { id: 'svc-4', name: 'Service Analyseurs', abrv: 'ANL', department_id: 'dep-2' },
  { id: 'svc-5', name: "Service Prévention", abrv: 'PRV', department_id: 'dep-4' },
];

/* ------------------------------------------------------------------ */
/*  Users                                                               */
/* ------------------------------------------------------------------ */

export const users: User[] = [
  {
    id: 'u-001', name: 'Karim Benali', username: 'k.benali', email: 'k.benali@sonatrach.dz',
    role: 'Directeur', status: 'active', is_admin: true,
    sub_direction: 'sd-1', department: 'dep-1', service: 'svc-1',
    created_at: '2024-01-15', approved_by: '—', approved_at: '2024-01-15',
  },
  {
    id: 'u-002', name: 'Amine Hadjadj', username: 'a.hadjadj', email: 'a.hadjadj@sonatrach.dz',
    role: 'Sous-directeur', status: 'active', is_admin: true,
    sub_direction: 'sd-1', department: 'dep-2', service: 'svc-3',
    created_at: '2024-02-10', approved_by: 'Karim Benali', approved_at: '2024-02-11',
  },
  {
    id: 'u-003', name: 'Yacine Cherif', username: 'y.cherif', email: 'y.cherif@sonatrach.dz',
    role: 'Chef de département', status: 'active', is_admin: false,
    sub_direction: 'sd-1', department: 'dep-1', service: 'svc-1',
    created_at: '2024-03-01', approved_by: 'Karim Benali', approved_at: '2024-03-02',
  },
  {
    id: 'u-004', name: 'Sofiane Mansouri', username: 's.mansouri', email: 's.mansouri@sonatrach.dz',
    role: 'Chef de service', status: 'active', is_admin: false,
    sub_direction: 'sd-1', department: 'dep-1', service: 'svc-2',
    created_at: '2024-03-15', approved_by: 'Amine Hadjadj', approved_at: '2024-03-16',
  },
  {
    id: 'u-005', name: 'Nadir Belkacem', username: 'n.belkacem', email: 'n.belkacem@sonatrach.dz',
    role: 'Employé', status: 'pending', is_admin: false,
    sub_direction: 'sd-1', department: 'dep-2', service: 'svc-3',
    created_at: '2026-09-12',
  },
  {
    id: 'u-006', name: 'Riad Saidi', username: 'r.saidi', email: 'r.saidi@sonatrach.dz',
    role: 'Employé', status: 'active', is_admin: false,
    sub_direction: 'sd-2', department: 'dep-3', service: 'svc-4',
    created_at: '2025-06-20', approved_by: 'Amine Hadjadj', approved_at: '2025-06-21',
  },
  {
    id: 'u-007', name: 'Toufik Larbi', username: 't.larbi', email: 't.larbi@sonatrach.dz',
    role: 'Employé', status: 'suspended', is_admin: false,
    sub_direction: 'sd-1', department: 'dep-1', service: 'svc-1',
    created_at: '2025-01-08', approved_by: 'Karim Benali', approved_at: '2025-01-09',
  },
  {
    id: 'u-008', name: 'Walid Bouzid', username: 'w.bouzid', email: 'w.bouzid@sonatrach.dz',
    role: 'Chef de service', status: 'inactive', is_admin: false,
    sub_direction: 'sd-3', department: 'dep-4', service: 'svc-5',
    created_at: '2024-09-05', approved_by: 'Karim Benali', approved_at: '2024-09-06',
  },
];

export const userPositionHistory: UserPositionHistory[] = [
  { id: 'h-1', user_id: 'u-003', field: 'Rôle', old_value: 'Employé', new_value: 'Chef de département', changed_by: 'Karim Benali', changed_at: '2025-05-01' },
  { id: 'h-2', user_id: 'u-003', field: 'Service', old_value: 'Service Régulation', new_value: 'Service Rotatives', changed_by: 'Karim Benali', changed_at: '2025-05-01' },
  { id: 'h-3', user_id: 'u-004', field: 'Rôle', old_value: 'Employé', new_value: 'Chef de service', changed_by: 'Amine Hadjadj', changed_at: '2025-03-10' },
  { id: 'h-4', user_id: 'u-007', field: 'Statut', old_value: 'Actif', new_value: 'Suspendu', changed_by: 'Karim Benali', changed_at: '2026-08-20' },
];

export const auditLog: AuditLogEntry[] = [
  { id: 'a-1', target_user_id: 'u-001', action: 'Création du compte', performed_by: 'Système', performed_at: '2024-01-15' },
  { id: 'a-2', target_user_id: 'u-002', action: 'Approbation', performed_by: 'Karim Benali', performed_at: '2024-02-11', details: 'Compte approuvé' },
  { id: 'a-3', target_user_id: 'u-005', action: 'Demande en attente', performed_by: 'Système', performed_at: '2026-09-12', details: 'Inscription en attente d\'approbation' },
  { id: 'a-4', target_user_id: 'u-007', action: 'Suspension', performed_by: 'Karim Benali', performed_at: '2026-08-20', details: 'Non-respect des procédures HSE' },
  { id: 'a-5', target_user_id: 'u-003', action: 'Promotion', performed_by: 'Karim Benali', performed_at: '2025-05-01', details: 'Employé → Chef de département' },
  { id: 'a-6', target_user_id: 'u-004', action: 'Promotion', performed_by: 'Amine Hadjadj', performed_at: '2025-03-10', details: 'Employé → Chef de service' },
];
export function getSubDirectionName(id: string) {
  return subDirections.find((sd) => sd.id === id)?.name ?? '—';
}

export function getDepartmentName(id: string) {
  return departments.find((d) => d.id === id)?.name ?? '—';
}

export function getServiceName(id: string) {
  return services.find((s) => s.id === id)?.name ?? '—';
}
