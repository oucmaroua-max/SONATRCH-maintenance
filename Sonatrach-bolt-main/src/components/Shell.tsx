import { useEffect, useState } from 'react';
import { Bell, ChevronDown, Menu, ShieldCheck, X } from 'lucide-react';
import { Brand } from '@/components/Brand';

export type PageKey = 'home' | 'login' | 'dashboard' | 'orders' | 'new-order';

const links: { key: PageKey; label: string }[] = [
  { key: 'home', label: 'Accueil' }, { key: 'dashboard', label: 'Tableau de bord' }, { key: 'orders', label: 'Ordres de travail' }, { key: 'new-order', label: 'Nouveau travail' },
];

export function navigate(page: PageKey | string) {
  const path = page === 'home' || page === '' ? '/' : `/${String(page).replace(/^\//, '')}`;
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

export function TopBar() {
  const [time, setTime] = useState('');
  useEffect(() => { const tick = () => setTime(new Date().toLocaleTimeString('fr-FR')); tick(); const timer = window.setInterval(tick, 1000); return () => window.clearInterval(timer); }, []);
  return <div className="bg-slate-950 px-4 py-2 text-[11px] text-slate-300"><div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2"><div className="flex items-center gap-2"><span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" /><span className="font-semibold text-slate-200">Division Raffinage & Pétrochimie (RPA)</span><span className="hidden text-slate-600 sm:inline">|</span><span className="hidden text-slate-400 sm:inline">Site Industriel de Sidi Arcine / Baraki</span></div><div className="flex items-center gap-4"><span className="hidden text-slate-400 md:inline">Heure serveur (UTC+1) : {time}</span><span className="flex items-center gap-1.5 text-emerald-400"><ShieldCheck size={13} /> GMAO disponible 24/7</span></div></div></div>;
}

export function Header({ active }: { active: PageKey }) {
  const [open, setOpen] = useState(false);
  return <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur"><div className="mx-auto flex h-[88px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8"><button onClick={() => navigate('home')} aria-label="Accueil"><Brand /></button><nav className="hidden items-center gap-1 lg:flex">{links.map(link => <button key={link.key} onClick={() => navigate(link.key)} className={`rounded-lg px-3.5 py-2 text-sm font-semibold transition ${active === link.key ? 'border border-orange-200 bg-orange-50 text-sonatrach' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}>{link.label}</button>)}</nav><div className="flex items-center gap-3">{active !== 'home' && <><button className="relative hidden rounded-lg p-2 text-slate-500 hover:bg-slate-100 sm:block"><Bell size={19} /><span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-sonatrach" /></button><div className="hidden text-right sm:block"><p className="text-xs font-bold text-slate-900">Ing. R. Bensalem</p><p className="text-[11px] font-medium text-slate-500">Chef de Quart / Superviseur</p></div><div className="flex h-9 w-9 items-center justify-center rounded-full border border-orange-200 bg-orange-50 text-xs font-bold text-sonatrach">RB</div></>}{active !== 'home' && <button className="rounded-lg p-2 lg:hidden" onClick={() => setOpen(!open)} aria-label="Menu">{open ? <X size={20} /> : <Menu size={20} />}</button>}</div></div>{active !== 'home' && open && <div className="border-t border-slate-100 bg-white px-4 py-3 lg:hidden">{links.map(link => <button key={link.key} onClick={() => { navigate(link.key); setOpen(false); }} className={`block w-full rounded-lg px-3 py-3 text-left text-sm font-semibold ${active === link.key ? 'bg-orange-50 text-sonatrach' : 'text-slate-700'}`}>{link.label}</button>)}</div>}</header>;
}

export function Footer() { return <footer className="border-t border-slate-800 bg-slate-950 text-slate-400"><div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 text-xs sm:grid-cols-2 lg:grid-cols-4 lg:px-8"><div><img src="/sonatrach-logo.png" alt="Sonatrach" className="h-16 w-auto rounded-md bg-white object-contain p-1.5" /><p className="mt-3 leading-relaxed">Activité Raffinage et Pétrochimie (RPA)<br />Direction Raffinage · Raffinerie d'Alger<br />Site Industriel de Sidi Arcine, Baraki.</p><p className="mt-3 font-semibold text-sonatrach">Direction Maintenance</p></div><div><p className="font-bold uppercase tracking-wider text-white">Support technique</p><p className="mt-3 leading-6">Poste interne : 44-21 / 44-22<br />gmao.alger@sonatrach.dz<br />Bâtiment Maintenance, Bureau 104</p></div><div><p className="font-bold uppercase tracking-wider text-white">Sécurité & réglementation</p><p className="mt-3 leading-relaxed">Chaque intervention est soumise au Permis de Travail et à l'analyse de risques ATEX.</p><span className="mt-3 inline-flex rounded border border-amber-800/60 bg-amber-950/40 px-2 py-1 text-amber-300">Zone industrielle classée Seveso</span></div><div><p className="font-bold uppercase tracking-wider text-white">Statut du système</p><p className="mt-3 flex justify-between">Base GMAO <span className="font-semibold text-emerald-400">Connectée</span></p><p className="mt-1 flex justify-between">Version <span className="font-mono text-slate-300">v4.2.0-SDA</span></p><p className="mt-1 flex justify-between">Accès <span className="text-slate-300">Intranet actif</span></p></div></div><div className="border-t border-slate-800 px-4 py-5 text-center text-[11px] text-slate-500">© 2026 SONATRACH · Système de suivi des travaux de maintenance</div></footer>; }

export function AppShell({ active, children }: { active: PageKey; children: React.ReactNode }) { return <div className="min-h-screen bg-slate-50"><TopBar /><Header active={active} />{children}<Footer /></div>; }
