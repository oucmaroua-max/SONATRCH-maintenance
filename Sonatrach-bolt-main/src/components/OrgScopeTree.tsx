import { Building2, ChevronRight, Layers } from 'lucide-react';

type OrgResponse = {
  sousDirections: { abrv: string; name: string }[];
  departements: { abrv: string; name: string; sousDirectionAbrv: string | null }[];
  services: { abrv: string; name: string; departementAbrv: string | null }[];
};

interface OrgScopeTreeProps {
  roleApi: string | null;
  own: { sousDirectionAbrv: string | null; departementAbrv: string | null; serviceAbrv: string | null };
  org: OrgResponse;
}

export function OrgScopeTree({ roleApi, own, org }: OrgScopeTreeProps) {
  let sousDirections = org.sousDirections;
  let departements = org.departements;
  let services = org.services;

  if (roleApi === 'sous_directeur') {
    sousDirections = sousDirections.filter((sd) => sd.abrv === own.sousDirectionAbrv);
    departements = departements.filter((d) => d.sousDirectionAbrv === own.sousDirectionAbrv);
    const depAbrvs = departements.map((d) => d.abrv);
    services = services.filter((s) => s.departementAbrv && depAbrvs.includes(s.departementAbrv));
  } else if (roleApi === 'chef_departement') {
    const dep = departements.find((d) => d.abrv === own.departementAbrv);
    departements = dep ? [dep] : [];
    sousDirections = sousDirections.filter((sd) => sd.abrv === dep?.sousDirectionAbrv);
    services = services.filter((s) => s.departementAbrv === own.departementAbrv);
  }
  // directeur : rien à filtrer, tout l'organigramme

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">Votre périmètre organisationnel</p>
      <div className="space-y-3">
        {sousDirections.map((sd) => {
          const deps = departements.filter((d) => d.sousDirectionAbrv === sd.abrv);
          return (
            <div key={sd.abrv}>
              <p className="flex items-center gap-1.5 text-sm font-bold text-slate-900">
                <Building2 size={15} className="text-sonatrach" /> {sd.name}
              </p>
              <div className="ml-5 mt-1.5 space-y-1.5 border-l border-slate-200 pl-4">
                {deps.map((d) => {
                  const svcs = services.filter((s) => s.departementAbrv === d.abrv);
                  return (
                    <div key={d.abrv}>
                      <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                        <Layers size={13} className="text-slate-400" /> {d.name}
                      </p>
                      <div className="ml-5 mt-1 flex flex-wrap gap-1.5">
                        {svcs.map((s) => (
                          <span key={s.abrv} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                            <ChevronRight size={10} /> {s.name}
                          </span>
                        ))}
                        {svcs.length === 0 && <span className="text-[11px] text-slate-400">Aucun service</span>}
                      </div>
                    </div>
                  );
                })}
                {deps.length === 0 && <span className="text-[11px] text-slate-400">Aucun département</span>}
              </div>
            </div>
          );
        })}
        {sousDirections.length === 0 && <p className="text-xs text-slate-400">Aucune donnée disponible.</p>}
      </div>
    </div>
  );
}