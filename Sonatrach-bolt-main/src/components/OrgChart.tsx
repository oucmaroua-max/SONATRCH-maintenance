import { Briefcase, Building2, Layers } from 'lucide-react';

type OrgResponse = {
  sousDirections: { abrv: string; name: string }[];
  departements: { abrv: string; name: string; sousDirectionAbrv: string | null }[];
  services: { abrv: string; name: string; departementAbrv: string | null }[];
};

type Selection = { sousDirection: string; department: string; service: string };
type Locks = { sdLocked: boolean; depLocked: boolean; svcLocked: boolean };

interface OrgChartProps {
  roleApi: string | null;
  own: { sousDirectionAbrv: string | null; departementAbrv: string | null; serviceAbrv: string | null };
  org: OrgResponse;
  selection: Selection;
  locks: Locks;
  onSelect: (next: Partial<Selection>) => void;
}

const LEVEL_ICON = { sd: Building2, dep: Layers, svc: Briefcase } as const;

export function OrgChart({ roleApi, own, org, selection, locks, onSelect }: OrgChartProps) {
  // Détermine la racine visible selon le rôle
  let visibleSousDirections = org.sousDirections;
  let rootLabel = 'Direction Maintenance';
  let rootIsRealNode = false;

  if (roleApi === 'sous_directeur') {
    visibleSousDirections = org.sousDirections.filter((sd) => sd.abrv === own.sousDirectionAbrv);
    rootIsRealNode = true;
  } else if (roleApi === 'chef_departement') {
    const dep = org.departements.find((d) => d.abrv === own.departementAbrv);
    rootLabel = dep?.name ?? 'Département';
    rootIsRealNode = true;
  }

  function NodeBox({
    label, level, abrv, clickable, selected,
  }: { label: string; level: 'root' | 'sd' | 'dep' | 'svc'; abrv?: string; clickable: boolean; selected: boolean }) {
    const Icon = level !== 'root' ? LEVEL_ICON[level] : null;
    return (
      <button
        type="button"
        disabled={!clickable}
        onClick={() => {
          if (!clickable || !abrv) return;
          if (level === 'sd') onSelect({ sousDirection: abrv, department: '', service: '' });
          if (level === 'dep') onSelect({ department: abrv, service: '' });
          if (level === 'svc') onSelect({ service: abrv });
        }}
        className="org-node"
        data-level={level}
        data-selected={selected}
        data-clickable={clickable}
        title={label}
      >
        {Icon && <Icon size={13} />}
        <span className="max-w-[160px] overflow-hidden text-ellipsis">{label}</span>
      </button>
    );
  }

  // Chef de département : racine = son département, enfants = ses services
  if (roleApi === 'chef_departement') {
    const services = org.services.filter((s) => s.departementAbrv === own.departementAbrv);
    return (
      <div className="org-chart">
        <ul>
          <li>
            <NodeBox label={rootLabel} level="root" clickable={false} selected={false} />
            {services.length > 0 && (
              <ul>
                {services.map((s) => (
                  <li key={s.abrv}>
                    <NodeBox label={s.name} level="svc" abrv={s.abrv} clickable={!locks.svcLocked} selected={selection.service === s.abrv} />
                  </li>
                ))}
              </ul>
            )}
          </li>
        </ul>
      </div>
    );
  }

  // Directeur (racine synthétique) ou Sous-directeur (racine = sa sous-direction)
  return (
    <div className="org-chart">
      <ul>
        <li>
          {rootIsRealNode ? (
            <NodeBox
              label={visibleSousDirections[0]?.name ?? '—'}
              level="root"
              clickable={false}
              selected={false}
            />
          ) : (
            <NodeBox label={rootLabel} level="root" clickable={false} selected={false} />
          )}
          {visibleSousDirections.length > 0 && (
            <ul>
              {visibleSousDirections.map((sd) => {
                const deps = org.departements.filter((d) => d.sousDirectionAbrv === sd.abrv);
                return (
                  <li key={sd.abrv}>
                    {/* En mode sous-directeur, la sous-direction est déjà la racine : on saute directement aux départements */}
                    {roleApi !== 'sous_directeur' && (
                      <NodeBox label={sd.name} level="sd" abrv={sd.abrv} clickable={!locks.sdLocked} selected={selection.sousDirection === sd.abrv} />
                    )}
                    {deps.length > 0 && (
                      <ul>
                        {deps.map((d) => {
                          const services = org.services.filter((s) => s.departementAbrv === d.abrv);
                          return (
                            <li key={d.abrv}>
                              <NodeBox label={d.name} level="dep" abrv={d.abrv} clickable={!locks.depLocked} selected={selection.department === d.abrv} />
                              {services.length > 0 && (
                                <ul>
                                  {services.map((s) => (
                                    <li key={s.abrv}>
                                      <NodeBox label={s.name} level="svc" abrv={s.abrv} clickable={!locks.svcLocked} selected={selection.service === s.abrv} />
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </li>
      </ul>
    </div>
  );
}