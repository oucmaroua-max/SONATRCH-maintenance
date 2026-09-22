/*import { useMemo } from 'react';
import { departments, services, subDirections } from '@/data';

interface OrgCascadeSelectProps {
  subDirection: string;
  department: string;
  service: string;
  onChange: (org: { sub_direction: string; department: string; service: string }) => void;
}

export function OrgCascadeSelect({ subDirection, department, service, onChange }: OrgCascadeSelectProps) {
  const filteredDepartments = useMemo(
    () => departments.filter((d) => d.sub_direction_id === subDirection),
    [subDirection],
  );

  const filteredServices = useMemo(
    () => services.filter((s) => s.department_id === department),
    [department],
  );

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <label className="block">
        <span className="mb-1.5 block text-sm font-bold text-slate-700">Sous-direction</span>
        <select
          value={subDirection}
          onChange={(e) => onChange({ sub_direction: e.target.value, department: '', service: '' })}
          className="w-full rounded-lg border-slate-300 text-sm focus:border-sonatrach focus:ring-orange-100"
        >
          <option value="">— Sélectionner —</option>
          {subDirections.map((sd) => (
            <option key={sd.id} value={sd.id}>{sd.name}</option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="mb-1.5 block text-sm font-bold text-slate-700">Département</span>
        <select
          value={department}
          disabled={!subDirection}
          onChange={(e) => onChange({ sub_direction: subDirection, department: e.target.value, service: '' })}
          className="w-full rounded-lg border-slate-300 text-sm focus:border-sonatrach focus:ring-orange-100 disabled:bg-slate-100"
        >
          <option value="">— Sélectionner —</option>
          {filteredDepartments.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="mb-1.5 block text-sm font-bold text-slate-700">Service</span>
        <select
          value={service}
          disabled={!department}
          onChange={(e) => onChange({ sub_direction: subDirection, department: department, service: e.target.value })}
          className="w-full rounded-lg border-slate-300 text-sm focus:border-sonatrach focus:ring-orange-100 disabled:bg-slate-100"
        >
          <option value="">— Sélectionner —</option>
          {filteredServices.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </label>
    </div>
  );
}
*/
import { useMemo } from 'react';

interface OrgOption { id: string; name: string; sub_direction_id?: string; department_id?: string }

interface OrgCascadeSelectProps {
  subDirection: string;
  department: string;
  service: string;
  subDirections: OrgOption[];
  departments: OrgOption[];
  services: OrgOption[];
  onChange: (org: { sub_direction: string; department: string; service: string }) => void;
}

export function OrgCascadeSelect({ subDirection, department, service, subDirections, departments, services, onChange }: OrgCascadeSelectProps) {
  const filteredDepartments = useMemo(
    () => departments.filter((d) => d.sub_direction_id === subDirection),
    [subDirection, departments],
  );
  const filteredServices = useMemo(
    () => services.filter((s) => s.department_id === department),
    [department, services],
  );

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <label className="block">
        <span className="mb-1.5 block text-sm font-bold text-slate-700">Sous-direction</span>
        <select value={subDirection} onChange={(e) => onChange({ sub_direction: e.target.value, department: '', service: '' })}
          className="w-full rounded-lg border-slate-300 text-sm focus:border-sonatrach focus:ring-orange-100">
          <option value="">— Sélectionner —</option>
          {subDirections.map((sd) => <option key={sd.id} value={sd.id}>{sd.name}</option>)}
        </select>
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm font-bold text-slate-700">Département</span>
        <select value={department} disabled={!subDirection}
          onChange={(e) => onChange({ sub_direction: subDirection, department: e.target.value, service: '' })}
          className="w-full rounded-lg border-slate-300 text-sm focus:border-sonatrach focus:ring-orange-100 disabled:bg-slate-100">
          <option value="">— Sélectionner —</option>
          {filteredDepartments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm font-bold text-slate-700">Service</span>
        <select value={service} disabled={!department}
          onChange={(e) => onChange({ sub_direction: subDirection, department, service: e.target.value })}
          className="w-full rounded-lg border-slate-300 text-sm focus:border-sonatrach focus:ring-orange-100 disabled:bg-slate-100">
          <option value="">— Sélectionner —</option>
          {filteredServices.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </label>
    </div>
  );
}