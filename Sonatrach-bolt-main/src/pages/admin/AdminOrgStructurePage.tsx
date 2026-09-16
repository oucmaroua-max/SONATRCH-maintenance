import { useState } from 'react';
import { AlertTriangle, Building2, ChevronRight, Layers, Pencil, Plus, Trash2, X } from 'lucide-react';
import { AppShell } from '@/components/Shell';
import { Modal } from '@/components/ui/Modal';
import {
  departments as seedDepartments,
  services as seedServices,
  subDirections as seedSubDirections,
} from '@/data';
import type { Department, Service, SubDirection } from '@/types';

type Tab = 'sub-directions' | 'departments' | 'services';

export function AdminOrgStructurePage() {
  const [tab, setTab] = useState<Tab>('sub-directions');
  const [subDirections, setSubDirections] = useState<SubDirection[]>(seedSubDirections);
  const [departments, setDepartments] = useState<Department[]>(seedDepartments);
  const [services, setServices] = useState<Service[]>(seedServices);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<{ type: Tab; id?: string; name: string; abrv: string; parent?: string } | null>(null);
  const [deleteWarning, setDeleteWarning] = useState<string | null>(null);

  function openAdd(type: Tab) {
    setEditing({ type, name: '', abrv: '' });
    setModalOpen(true);
  }

  function openEdit(type: Tab, item: SubDirection | Department | Service) {
    if (type === 'sub-directions') {
      setEditing({ type, id: item.id, name: item.name, abrv: item.abrv });
    } else if (type === 'departments') {
      const d = item as Department;
      setEditing({ type, id: d.id, name: d.name, abrv: d.abrv, parent: d.sub_direction_id });
    } else {
      const s = item as Service;
      setEditing({ type, id: s.id, name: s.name, abrv: s.abrv, parent: s.department_id });
    }
    setModalOpen(true);
  }

  function save() {
    if (!editing || !editing.name.trim() || !editing.abrv.trim()) return;
    if (editing.type === 'sub-directions') {
      if (editing.id) {
        setSubDirections((prev) => prev.map((sd) => sd.id === editing.id ? { ...sd, name: editing.name, abrv: editing.abrv } : sd));
      } else {
        setSubDirections((prev) => [...prev, { id: `sd-${Date.now()}`, name: editing.name, abrv: editing.abrv }]);
      }
    } else if (editing.type === 'departments') {
      if (editing.id) {
        setDepartments((prev) => prev.map((d) => d.id === editing.id ? { ...d, name: editing.name, abrv: editing.abrv, sub_direction_id: editing.parent ?? d.sub_direction_id } : d));
      } else {
        setDepartments((prev) => [...prev, { id: `dep-${Date.now()}`, name: editing.name, abrv: editing.abrv, sub_direction_id: editing.parent ?? '' }]);
      }
    } else {
      if (editing.id) {
        setServices((prev) => prev.map((s) => s.id === editing.id ? { ...s, name: editing.name, abrv: editing.abrv, department_id: editing.parent ?? s.department_id } : s));
      } else {
        setServices((prev) => [...prev, { id: `svc-${Date.now()}`, name: editing.name, abrv: editing.abrv, department_id: editing.parent ?? '' }]);
      }
    }
    setModalOpen(false);
    setEditing(null);
  }

  function tryDelete(type: Tab, id: string) {
    // Check for children
    if (type === 'sub-directions' && departments.some((d) => d.sub_direction_id === id)) {
      setDeleteWarning('Impossible de supprimer : des départements sont rattachés à cette sous-direction.');
      return;
    }
    if (type === 'departments' && services.some((s) => s.department_id === id)) {
      setDeleteWarning('Impossible de supprimer : des services sont rattachés à ce département.');
      return;
    }
    if (type === 'sub-directions') setSubDirections((prev) => prev.filter((sd) => sd.id !== id));
    if (type === 'departments') setDepartments((prev) => prev.filter((d) => d.id !== id));
    if (type === 'services') setServices((prev) => prev.filter((s) => s.id !== id));
  }

  const tabs: { key: Tab; label: string; icon: typeof Building2; count: number }[] = [
    { key: 'sub-directions', label: 'Sous-directions', icon: Building2, count: subDirections.length },
    { key: 'departments', label: 'Départements', icon: Layers, count: departments.length },
    { key: 'services', label: 'Services', icon: ChevronRight, count: services.length },
  ];

  return (
    <AppShell active="admin-org">
      <main className="industrial-grid min-h-[calc(100vh-200px)]">
        <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 lg:px-8">
          {/* Header */}
          <div>
            <p className="text-xs font-bold uppercase tracking-[.2em] text-sonatrach">
              Administration · Structure organisationnelle
            </p>
            <h1 className="heading mt-2 text-3xl font-extrabold tracking-tight text-slate-950">
              Organisation
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Gérez la hiérarchie : sous-directions → départements → services.
            </p>
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap gap-2">
            {tabs.map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold transition ${
                    tab === t.key
                      ? 'border border-orange-200 bg-orange-50 text-sonatrach shadow-sm'
                      : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Icon size={16} /> {t.label}
                  <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                    tab === t.key ? 'bg-sonatrach text-white' : 'bg-slate-100 text-slate-500'
                  }`}>{t.count}</span>
                </button>
              );
            })}
          </div>

          {/* List */}
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h2 className="heading text-lg font-bold text-slate-900">
                {tab === 'sub-directions' && 'Sous-directions'}
                {tab === 'departments' && 'Départements'}
                {tab === 'services' && 'Services'}
              </h2>
              <button
                onClick={() => openAdd(tab)}
                className="inline-flex items-center gap-2 rounded-lg bg-sonatrach px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-orange-100 transition hover:bg-sonatrach-600"
              >
                <Plus size={16} /> Ajouter
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {tab === 'sub-directions' && subDirections.map((sd) => (
                <div key={sd.id} className="flex items-center justify-between px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50 text-sonatrach">
                      <Building2 size={18} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">{sd.name}</p>
                      <p className="text-xs text-slate-500">Abréviation : <span className="font-mono font-bold">{sd.abrv}</span></p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEdit('sub-directions', sd)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><Pencil size={15} /></button>
                    <button onClick={() => tryDelete('sub-directions', sd.id)} className="rounded-lg p-2 text-red-500 hover:bg-red-50"><Trash2 size={15} /></button>
                  </div>
                </div>
              ))}

              {tab === 'departments' && departments.map((d) => (
                <div key={d.id} className="flex items-center justify-between px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                      <Layers size={18} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">{d.name}</p>
                      <p className="text-xs text-slate-500">
                        <span className="font-mono font-bold">{d.abrv}</span> · {subDirections.find((sd) => sd.id === d.sub_direction_id)?.name ?? '—'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEdit('departments', d)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><Pencil size={15} /></button>
                    <button onClick={() => tryDelete('departments', d.id)} className="rounded-lg p-2 text-red-500 hover:bg-red-50"><Trash2 size={15} /></button>
                  </div>
                </div>
              ))}

              {tab === 'services' && services.map((s) => (
                <div key={s.id} className="flex items-center justify-between px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-50 text-cyan-600">
                      <ChevronRight size={18} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">{s.name}</p>
                      <p className="text-xs text-slate-500">
                        <span className="font-mono font-bold">{s.abrv}</span> · {departments.find((d) => d.id === s.department_id)?.name ?? '—'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEdit('services', s)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><Pencil size={15} /></button>
                    <button onClick={() => tryDelete('services', s.id)} className="rounded-lg p-2 text-red-500 hover:bg-red-50"><Trash2 size={15} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Add/Edit modal */}
      {modalOpen && editing && (
        <Modal
          title={editing.id ? 'Modifier' : 'Ajouter'}
          subtitle={
            editing.type === 'sub-directions' ? 'Sous-direction' :
            editing.type === 'departments' ? 'Département' : 'Service'
          }
          onClose={() => { setModalOpen(false); setEditing(null); }}
          footer={
            <>
              <button onClick={() => { setModalOpen(false); setEditing(null); }} className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Annuler</button>
              <button onClick={save} className="rounded-lg bg-sonatrach px-5 py-2.5 text-sm font-bold text-white hover:bg-sonatrach-600">Enregistrer</button>
            </>
          }
        >
          <div className="space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-sm font-bold text-slate-700">Nom <span className="text-red-500">*</span></span>
              <input
                value={editing.name}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                className="w-full rounded-lg border-slate-300 text-sm focus:border-sonatrach focus:ring-orange-100"
                placeholder="Ex: Sous-direction Maintenance"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-bold text-slate-700">Abréviation <span className="text-red-500">*</span></span>
              <input
                value={editing.abrv}
                onChange={(e) => setEditing({ ...editing, abrv: e.target.value.toUpperCase() })}
                maxLength={6}
                className="w-full rounded-lg border-slate-300 font-mono text-sm focus:border-sonatrach focus:ring-orange-100"
                placeholder="Ex: SDM"
              />
            </label>
            {editing.type === 'departments' && (
              <label className="block">
                <span className="mb-1.5 block text-sm font-bold text-slate-700">Sous-direction parente</span>
                <select
                  value={editing.parent ?? ''}
                  onChange={(e) => setEditing({ ...editing, parent: e.target.value })}
                  className="w-full rounded-lg border-slate-300 text-sm focus:border-sonatrach focus:ring-orange-100"
                >
                  <option value="">— Sélectionner —</option>
                  {subDirections.map((sd) => (
                    <option key={sd.id} value={sd.id}>{sd.name}</option>
                  ))}
                </select>
              </label>
            )}
            {editing.type === 'services' && (
              <label className="block">
                <span className="mb-1.5 block text-sm font-bold text-slate-700">Département parent</span>
                <select
                  value={editing.parent ?? ''}
                  onChange={(e) => setEditing({ ...editing, parent: e.target.value })}
                  className="w-full rounded-lg border-slate-300 text-sm focus:border-sonatrach focus:ring-orange-100"
                >
                  <option value="">— Sélectionner —</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </label>
            )}
          </div>
        </Modal>
      )}

      {/* Delete warning */}
      {deleteWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-red-200 bg-white p-6 shadow-soft">
            <div className="flex items-start gap-3">
              <AlertTriangle className="shrink-0 text-red-500" size={24} />
              <div>
                <h3 className="font-bold text-slate-900">Suppression impossible</h3>
                <p className="mt-1 text-sm text-slate-600">{deleteWarning}</p>
              </div>
            </div>
            <button
              onClick={() => setDeleteWarning(null)}
              className="mt-5 w-full rounded-lg bg-slate-900 py-2.5 text-sm font-bold text-white"
            >
              Compris
            </button>
          </div>
        </div>
      )}
    </AppShell>
  );
}
