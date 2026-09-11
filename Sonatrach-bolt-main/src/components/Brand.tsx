import logo from '@/assets/sonatrach-logo.png';

export const sonatrachLogo = logo;

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <img
        src={logo}
        alt="Sonatrach"
        className={compact ? 'h-10 w-auto object-contain' : 'h-14 w-auto object-contain'}
      />
      {!compact && (
        <div className="border-l border-slate-200 pl-3">
          <p className="heading text-sm font-extrabold uppercase tracking-tight text-slate-900">Raffinerie d'Alger</p>
          <p className="text-xs font-semibold uppercase tracking-wider text-sonatrach">Direction Maintenance</p>
        </div>
      )}
    </div>
  );
}
