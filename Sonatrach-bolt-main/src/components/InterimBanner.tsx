import { ArrowRightCircle, LogOut } from 'lucide-react';
import { useSyncExternalStore } from 'react';
import { enterInterim, exitInterim, getActingInterim, getActiveInterims, subscribeSession } from '@/session';

export function InterimBanner() {
  const activeInterims = useSyncExternalStore(subscribeSession, getActiveInterims);
  const acting = useSyncExternalStore(subscribeSession, getActingInterim);

  if (acting) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-lg border-l-4 border-[#F58220] bg-[#1B2A4A]/5 px-3 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[#F58220]" />
          <p className="truncate text-xs font-semibold text-[#1B2A4A]">
            Espace de <span className="text-[#F58220]">{acting.delegatingUser?.name}</span>
            <span className="ml-1 font-normal text-[#1B2A4A]/60">(intérim)</span>
          </p>
        </div>
        <button
          onClick={() => exitInterim()}
          className="inline-flex shrink-0 items-center gap-1 rounded-md bg-[#1B2A4A] px-2.5 py-1 text-xs font-semibold text-white transition-colors hover:bg-[#F58220]"
        >
          <LogOut size={12} /> Quitter
        </button>
      </div>
    );
  }

  if (activeInterims.length > 0) {
    return (
      <div className="space-y-1.5">
        {activeInterims.map((i) => (
          <div
            key={i.id}
            className="flex items-center justify-between gap-3 rounded-lg border-l-4 border-[#1B2A4A] bg-[#1B2A4A]/5 px-3 py-2"
          >
            <div className="flex min-w-0 items-center gap-2">
              <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[#1B2A4A]" />
              <p className="truncate text-xs font-semibold text-[#1B2A4A]">
                Remplacement de <span className="text-[#F58220]">{i.delegatingUser?.name}</span>
                <span className="ml-1 font-normal text-[#1B2A4A]/60">
                  ({i.startDate} → {i.endDate})
                </span>
              </p>
            </div>
            <button
              onClick={() => enterInterim(i.id)}
              className="inline-flex shrink-0 items-center gap-1 rounded-md bg-[#F58220] px-2.5 py-1 text-xs font-semibold text-white transition-colors hover:bg-[#1B2A4A]"
            >
              <ArrowRightCircle size={12} /> Entrer
            </button>
          </div>
        ))}
      </div>
    );
  }

  return null;
}