import { AlertTriangle, ArrowLeft, CheckCircle2, ClipboardPenLine } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import { AppShell, navigate } from '@/components/Shell';
import { OrgScopeTree } from '@/components/OrgScopeTree';
import { api } from '@/api';
import { getEffectiveOrgScope, getEffectiveRole, ROLE_TO_API } from '@/session';
import { createWork, listAssignableUsers } from '@/works';
import { PRIORITY_TO_API } from '@/workTypes';

type OrgResponse = {
  sousDirections: { abrv: string; name: string }[];
  departements: { abrv: string; name: string; sousDirectionAbrv: string | null }[];
  services: { abrv: string; name: string; departementAbrv: string | null }[];
};

const NEXT_ROLE_LABEL: Record<string, string> = {
  directeur: 'sous-directeur', sous_directeur: 'chef de département',
  chef_departement: 'chef de service', chef_service: 'employé',
};

export function NewWorkOrderPage() {
  const [saved, setSaved] = useState(false);
  const [org, setOrg] = useState<OrgResponse>({ sousDirections: [], departements: [], services: [] });
  const [assignees, setAssignees] = useState<{ id: string; name: string; role: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [sousDirection, setSousDirection] = useState('');
  const [department, setDepartment] = useState('');
  const [service, setService] = useState('');
  const [assignedToId, setAssignedToId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('Normale');
  const [startDate, setStartDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [workerCount, setWorkerCount] = useState('2');
  const [unit, setUnit] = useState('');
  const [equipment, setEquipment] = useState('');
  const [permit, setPermit] = useState('');
  const [observation, setObservation] = useState('');

  const role = getEffectiveRole();
  const roleApi = ROLE_TO_API[role] ?? null;
  const own = getEffectiveOrgScope();
  const nextRoleLabel = roleApi ? NEXT_ROLE_LABEL[roleApi] ?? null : null;

  // Verrouillage des champs selon le niveau hiérarchique
  const sdLocked = roleApi !== 'directeur';
  const depLocked = roleApi === 'chef_departement' || roleApi === 'chef_service';
  const svcLocked = roleApi === 'chef_service';

  // Chargement initial : organigramme + pré-remplissage du périmètre propre
  useEffect(() => {
    (async () => {
      try {
        const orgTree = await api<OrgResponse>('/api/org');
        setOrg(orgTree);
        setSousDirection(sdLocked ? (own.sousDirectionAbrv ?? '') : '');
        setDepartment(depLocked ? (own.departementAbrv ?? '') : '');
        setService(svcLocked ? (own.serviceAbrv ?? '') : '');
        setLoadError(null);
      } catch (e) {
        setLoadError(e instanceof Error ? e.message : 'Erreur de chargement');
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Rafraîchit la liste des responsables assignables selon la branche choisie
  useEffect(() => {
    if (loading || !roleApi) return;
    setAssignedToId('');
    listAssignableUsers({
      sousDirectionAbrv: sousDirection || undefined,
      departementAbrv: department || undefined,
      serviceAbrv: service || undefined,
    }).then(setAssignees).catch(() => setAssignees([]));
  }, [sousDirection, department, service, loading, roleApi]);

  const filteredDepartments = org.departements.filter((d) => d.sousDirectionAbrv === sousDirection);
  const filteredServices = org.services.filter((s) => s.departementAbrv === department);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);
    if (!title || !description || !service || !assignedToId || !startDate) {
      setFormError('Merci de remplir tous les champs obligatoires.');
      return;
    }
    setSaving(true);
    try {
      await createWork({
        title, description, serviceAbrv: service, assignedToId, startDate, dueDate: dueDate || undefined,
        priority: PRIORITY_TO_API[priority], workerCount: Number(workerCount) || 1,
        unit: unit || undefined, equipment: equipment || undefined, permit: permit || undefined, observation: observation || undefined,
      });
      setSaved(true);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Création impossible');
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell active="new-order">
      <main className="min-h-[calc(100vh-200px)] bg-slate-50 py-8 sm:py-10">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <button onClick={() => navigate('orders')} className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900">
            <ArrowLeft size={16} /> Retour au registre
          </button>
          <div className="mb-7">
            <p className="text-xs font-bold uppercase tracking-[.2em] text-sonatrach">Ordres d'intervention / Création</p>
            <h1 className="heading mt-2 text-3xl font-extrabold text-slate-950">Nouveau travail</h1>
            <p className="mt-1 text-sm text-slate-600">
              {nextRoleLabel ? `Ce travail sera confié à un ${nextRoleLabel} de votre périmètre.` : "Créez un nouvel ordre."}
            </p>
          </div>

          <div className="mb-6 flex items-start gap-3 rounded-xl border-l-4 border-sonatrach bg-orange-50 p-4 text-sm text-slate-700">
            <AlertTriangle size={19} className="mt-0.5 shrink-0 text-sonatrach" />
            <span><strong className="text-slate-900">Rappel procédure sécurité :</strong> le Permis de Travail et l'alignement avec le protocole de cadenassage sont obligatoires avant exécution.</span>
          </div>

          {loading && <p className="text-sm text-slate-500">Chargement…</p>}
          {loadError && <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{loadError}</div>}

          {!loading && !nextRoleLabel && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm font-semibold text-amber-800">
              Votre rôle ne permet pas de créer un ordre de travail.
            </div>
          )}

          {!loading && nextRoleLabel && (
            saved ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-10 text-center">
                <CheckCircle2 className="mx-auto text-emerald-600" size={44} />
                <h2 className="heading mt-4 text-2xl font-extrabold text-emerald-900">Travail créé avec succès</h2>
                <p className="mt-2 text-sm text-emerald-800">L'ordre de travail a été enregistré et affecté.</p>
                <button onClick={() => navigate('orders')} className="mt-6 rounded-lg bg-slate-900 px-5 py-3 text-sm font-bold text-white">Voir le registre</button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Schéma du périmètre — masqué pour chef de service (un seul service) */}
                {roleApi !== 'chef_service' && <OrgScopeTree roleApi={roleApi} own={own} org={org} />}

                <form onSubmit={onSubmit} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50/70 px-6 py-5">
                    <div className="rounded-lg bg-orange-100 p-2.5 text-sonatrach"><ClipboardPenLine size={20} /></div>
                    <div>
                      <h2 className="font-bold text-slate-900">Détails du travail</h2>
                      <p className="text-xs text-slate-500">Les champs marqués d'un astérisque sont obligatoires.</p>
                    </div>
                  </div>

                  <div className="space-y-6 p-6 sm:p-8">
                    <label className="block">
                      <span className="mb-2 block text-sm font-bold text-slate-800">Titre <b className="text-red-500">*</b></span>
                      <input required value={title} onChange={(e) => setTitle(e.target.value)}
                        className="w-full rounded-lg border-slate-300 text-sm focus:border-sonatrach focus:ring-orange-100" placeholder="Ex: Inspection vibratoire pompe P-101A" />
                    </label>

                    <div>
                      <p className="mb-2 text-sm font-bold text-slate-800">Partie concernée par le travail</p>
                      <div className="grid gap-6 md:grid-cols-3">
                        <label>
                          <span className="mb-2 block text-xs font-semibold text-slate-600">Sous-direction {!sdLocked && <span className="text-red-500">*</span>}</span>
                          <select required disabled={sdLocked} value={sousDirection}
                            onChange={(e) => { setSousDirection(e.target.value); setDepartment(''); setService(''); }}
                            className="w-full rounded-lg border-slate-300 text-sm focus:border-sonatrach focus:ring-orange-100 disabled:bg-slate-100">
                            <option value="">— Sélectionner —</option>
                            {org.sousDirections.map((sd) => <option key={sd.abrv} value={sd.abrv}>{sd.name}</option>)}
                          </select>
                        </label>
                        <label>
                          <span className="mb-2 block text-xs font-semibold text-slate-600">Département {!depLocked && <span className="text-red-500">*</span>}</span>
                          <select required disabled={depLocked || !sousDirection} value={department}
                            onChange={(e) => { setDepartment(e.target.value); setService(''); }}
                            className="w-full rounded-lg border-slate-300 text-sm focus:border-sonatrach focus:ring-orange-100 disabled:bg-slate-100">
                            <option value="">— Sélectionner —</option>
                            {filteredDepartments.map((d) => <option key={d.abrv} value={d.abrv}>{d.name}</option>)}
                          </select>
                        </label>
                        <label>
                          <span className="mb-2 block text-xs font-semibold text-slate-600">Service {!svcLocked && <span className="text-red-500">*</span>}</span>
                          <select required disabled={svcLocked || !department} value={service}
                            onChange={(e) => setService(e.target.value)}
                            className="w-full rounded-lg border-slate-300 text-sm focus:border-sonatrach focus:ring-orange-100 disabled:bg-slate-100">
                            <option value="">— Sélectionner —</option>
                            {filteredServices.map((s) => <option key={s.abrv} value={s.abrv}>{s.name}</option>)}
                          </select>
                        </label>
                      </div>
                    </div>

                    <label className="block">
                      <span className="mb-2 block text-sm font-bold text-slate-800">
                        Affecter à ({nextRoleLabel}) <b className="text-red-500">*</b>
                      </span>
                      <select required value={assignedToId} onChange={(e) => setAssignedToId(e.target.value)}
                        className="w-full rounded-lg border-slate-300 text-sm focus:border-sonatrach focus:ring-orange-100">
                        <option value="">— Sélectionner —</option>
                        {assignees.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                      </select>
                      {service && assignees.length === 0 && (
                        <p className="mt-1 text-xs text-amber-600">Aucun {nextRoleLabel} disponible pour cette sélection.</p>
                      )}
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-sm font-bold text-slate-800">Description <b className="text-red-500">*</b></span>
                      <textarea required rows={4} value={description} onChange={(e) => setDescription(e.target.value)}
                        placeholder="Décrivez la panne, les symptômes ou la consigne de maintenance..."
                        className="w-full resize-y rounded-lg border-slate-300 text-sm focus:border-sonatrach focus:ring-orange-100" />
                    </label>

                    <div className="grid gap-6 sm:grid-cols-3">
                      <label>
                        <span className="mb-2 block text-sm font-bold text-slate-800">Priorité</span>
                        <select value={priority} onChange={(e) => setPriority(e.target.value)}
                          className="w-full rounded-lg border-slate-300 text-sm focus:border-sonatrach focus:ring-orange-100">
                          <option>Normale</option><option>Haute</option><option>Critique</option>
                        </select>
                      </label>
                      <label>
                        <span className="mb-2 block text-sm font-bold text-slate-800">Date de début <b className="text-red-500">*</b></span>
                        <input required type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                          className="w-full rounded-lg border-slate-300 text-sm focus:border-sonatrach focus:ring-orange-100" />
                      </label>
                      <label>
                        <span className="mb-2 block text-sm font-bold text-slate-800">Date de fin prévue</span>
                        <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
                          className="w-full rounded-lg border-slate-300 text-sm focus:border-sonatrach focus:ring-orange-100" />
                      </label>
                    </div>

                    <div className="grid gap-6 md:grid-cols-3">
                      <label>
                        <span className="mb-2 block text-sm font-bold text-slate-800">Nombre d'agents</span>
                        <input type="number" min="1" max="25" value={workerCount} onChange={(e) => setWorkerCount(e.target.value)}
                          className="w-full rounded-lg border-slate-300 text-sm focus:border-sonatrach focus:ring-orange-100" />
                      </label>
                      <label>
                        <span className="mb-2 block text-sm font-bold text-slate-800">Unité / zone</span>
                        <input value={unit} onChange={(e) => setUnit(e.target.value)}
                          className="w-full rounded-lg border-slate-300 text-sm focus:border-sonatrach focus:ring-orange-100" />
                      </label>
                      <label>
                        <span className="mb-2 block text-sm font-bold text-slate-800">Équipement / repère</span>
                        <input value={equipment} onChange={(e) => setEquipment(e.target.value)}
                          className="w-full rounded-lg border-slate-300 text-sm focus:border-sonatrach focus:ring-orange-100" />
                      </label>
                    </div>

                    <label className="block">
                      <span className="mb-2 block text-sm font-bold text-slate-800">Permis de travail</span>
                      <input value={permit} onChange={(e) => setPermit(e.target.value)}
                        className="w-full rounded-lg border-slate-300 text-sm focus:border-sonatrach focus:ring-orange-100" />
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-sm font-bold text-slate-800">Observation</span>
                      <textarea rows={3} value={observation} onChange={(e) => setObservation(e.target.value)}
                        placeholder="Outillage, pièces de rechange, consignation électrique requise..."
                        className="w-full resize-y rounded-lg border-slate-300 text-sm focus:border-sonatrach focus:ring-orange-100" />
                    </label>

                    {formError && <p className="text-sm font-semibold text-red-600">{formError}</p>}

                    <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:justify-end">
                      <button type="button" onClick={() => navigate('orders')} className="rounded-lg border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">Annuler</button>
                      <button disabled={saving} className="rounded-lg bg-slate-900 px-6 py-3 text-sm font-bold text-white transition hover:bg-slate-800 disabled:opacity-60">
                        {saving ? 'Création…' : 'Créer le travail'}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            )
          )}
        </div>
      </main>
    </AppShell>
  );
}