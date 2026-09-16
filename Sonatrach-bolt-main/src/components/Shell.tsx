import { useEffect, useState, useSyncExternalStore } from 'react';
import { Bell, FileText, Home, LogOut, Mail, Menu, ShieldCheck, X, Factory, Users, Building2 } from 'lucide-react';
import { Brand } from '@/components/Brand';
import logo from '@/assets/sonatrach-logo.png';
import { getSessionUser, subscribeSession, userInitials } from '@/session';

export const sonatrachLogo = logo;

//export type PageKey = 'home' | 'login' | 'dashboard' | 'orders' | 'new-order';
export type PageKey =
  | 'home' | 'login' | 'dashboard' | 'orders' | 'new-order'
  | 'admin-users' | 'admin-user-form' | 'admin-user-detail' | 'admin-org';

const links: { key: PageKey; label: string }[] = [
  { key: 'home', label: 'Accueil' },
  { key: 'dashboard', label: 'Tableau de bord' },
  { key: 'orders', label: 'Ordres de travail' },
  { key: 'new-order', label: 'Nouveau travail' },
];

// Liens de navigation propres à l'espace admin (indépendants des liens "travaux").
const adminLinks: { key: PageKey; label: string; icon: typeof Users }[] = [
  { key: 'admin-users', label: 'Utilisateurs', icon: Users },
  { key: 'admin-org', label: 'Organisation', icon: Building2 },
];

const homeLinks: { key: PageKey | 'about'; label: string; icon: typeof Home }[] = [
  { key: 'home', label: 'Accueil', icon: Home },
  { key: 'about', label: 'À propos de nous', icon: FileText },
  { key: 'login', label: 'Connexion', icon: Mail },
];

export function navigate(page: PageKey | string) {
  const path = page === 'home' || page === '' ? '/' : `/${String(page).replace(/^\//, '')}`;
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

// Une page est considérée "admin" si sa clé commence par "admin".
function isAdminPage(active: PageKey) {
  return active.startsWith('admin');
}

export function TopBar({ admin = false }: { admin?: boolean }) {
  const [time, setTime] = useState('');
  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString('fr-FR'));
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, []);
  return (
    <div className={`px-4 py-2 text-[11px] text-slate-300 ${admin ? 'bg-slate-900' : 'bg-slate-950'}`}>
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 animate-pulse rounded-full ${admin ? 'bg-orange-400' : 'bg-emerald-400'}`} />
          <span className="font-semibold text-slate-200">
            {admin ? 'Espace Administration · Sécurité & Accès' : 'Division Raffinage & Pétrochimie (RPA)'}
          </span>
          <span className="hidden text-slate-600 sm:inline">|</span>
          <span className="hidden text-slate-400 sm:inline">Site Industriel de Sidi Arcine / Baraki</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="hidden text-slate-400 md:inline">Heure serveur (UTC+1) : {time}</span>
          <span className="flex items-center gap-1.5 text-emerald-400">
            <ShieldCheck size={13} /> GMAO disponible 24/7
          </span>
        </div>
      </div>
    </div>
  );
}

/* Header dédié à la page d'accueil : logo, navigation centrale, panneau institutionnel en biais. */
function HomeHeader() {
  const [open, setOpen] = useState(false);
  const go = (key: PageKey | 'about') =>
    key === 'about'
      ? document.getElementById('perimetre')?.scrollIntoView({ behavior: 'smooth' })
      : navigate(key);

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
      <div className="relative flex h-[88px] items-center">
        {/* Marque à gauche */}
        <button onClick={() => navigate('home')} aria-label="Accueil" className="flex items-center gap-3 pl-4 sm:pl-6 lg:pl-8">
          <img src={logo} alt="Sonatrach" className="h-11 w-auto object-contain" />
          <span className="hidden border-l border-slate-200 pl-3 text-left sm:block">
            <span className="block text-sm font-extrabold leading-tight tracking-tight text-slate-950">RAFFINERIE D'ALGER</span>
            <span className="block text-xs font-bold uppercase tracking-widest text-sonatrach">Direction Maintenance</span>
          </span>
        </button>

        {/* Navigation centrale */}
        <nav className="mx-auto hidden items-center gap-2 lg:flex">
          {homeLinks.map(link => {
            const Icon = link.icon;
            const active = link.key === 'home';
            return (
              <button
                key={link.key}
                onClick={() => go(link.key)}
                className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
                  active
                    ? 'border border-orange-200 bg-orange-50 text-sonatrach shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon size={16} /> {link.label}
              </button>
            );
          })}
        </nav>

        {/* Panneau institutionnel en biais à droite */}
        <div className="relative ml-auto hidden h-full w-[300px] md:block">
          <div className="absolute inset-0 bg-sonatrach" style={{ clipPath: 'polygon(46px 0, 100% 0, 100% 100%, 0 100%)' }} />
          <div className="absolute inset-0 bg-slate-950" style={{ clipPath: 'polygon(62px 0, 100% 0, 100% 100%, 16px 100%)' }} />
          <div className="relative flex h-full items-center justify-end gap-3 pr-6 text-right">
            <Factory size={30} className="text-white/85" />
            <span>
              <span className="block text-sm font-bold text-white">Raffinerie d'Alger</span>
              <span className="block text-xs font-medium text-sonatrach">Energie pour demain</span>
            </span>
          </div>
        </div>

        {/* Menu mobile */}
        <button className="ml-auto mr-4 rounded-lg p-2 lg:hidden" onClick={() => setOpen(!open)} aria-label="Menu">
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {open && (
        <div className="border-t border-slate-100 bg-white px-4 py-3 lg:hidden">
          {homeLinks.map(link => (
            <button
              key={link.key}
              onClick={() => { go(link.key); setOpen(false); }}
              className={`block w-full rounded-lg px-3 py-3 text-left text-sm font-semibold ${
                link.key === 'home' ? 'bg-orange-50 text-sonatrach' : 'text-slate-700'
              }`}
            >
              {link.label}
            </button>
          ))}
        </div>
      )}
    </header>
  );
}

export function Header({ active }: { active: PageKey }) {
  const [open, setOpen] = useState(false);
  const user = useSyncExternalStore(subscribeSession, getSessionUser);

  // Page d'accueil : header institutionnel dédié (inchangé).
  if (active === 'home') return <HomeHeader />;

  const admin = isAdminPage(active);

  // Liens applicatifs : ceux de l'espace admin OU ceux de l'espace travaux, jamais mélangés.
  const navLinks = admin ? adminLinks : links.filter(link => link.key !== 'home');

  // Où mène le logo/marque selon l'espace dans lequel on se trouve.
  const brandTarget: PageKey = admin ? 'admin-users' : 'home';

  return (
    <header className={`sticky top-0 z-30 border-b bg-white/95 shadow-sm backdrop-blur ${admin ? 'border-orange-200' : 'border-slate-200'}`}>
      <div className="mx-auto flex h-[88px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <button onClick={() => navigate(brandTarget)} aria-label={admin ? 'Accueil admin' : 'Accueil'}>
          <Brand />
        </button>

        {admin && (
          <span className="hidden rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-sonatrach sm:inline-flex">
            Administration
          </span>
        )}

        <nav className="hidden items-center gap-1 lg:flex">
          {navLinks.map(link => {
            const Icon = 'icon' in link ? link.icon : undefined;
            return (
              <button
                key={link.key}
                onClick={() => navigate(link.key)}
                className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold transition ${
                  active === link.key ? 'border border-orange-200 bg-orange-50 text-sonatrach' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {Icon && <Icon size={15} />} {link.label}
              </button>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <button className="relative hidden rounded-lg p-2 text-slate-500 hover:bg-slate-100 sm:block">
            <Bell size={19} /><span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-sonatrach" />
          </button>
          <div className="hidden text-right sm:block">
            <p className="text-xs font-bold text-slate-900">{user.name}</p>
            <p className="text-[11px] font-medium text-slate-500">{user.role}</p>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-orange-200 bg-orange-50 text-xs font-bold text-sonatrach">
            {userInitials(user.name)}
          </div>
          {/* Retour à l'espace travaux depuis l'admin, sinon déconnexion normale. */}
          <button
            onClick={() => navigate(admin ? 'dashboard' : 'home')}
            className="hidden items-center gap-2 rounded-lg border border-slate-200 px-3.5 py-2 text-sm font-semibold text-slate-600 transition hover:border-orange-200 hover:bg-orange-50 hover:text-sonatrach lg:inline-flex"
          >
            {admin ? <>Retour à l'espace travaux</> : <><LogOut size={16} /> Déconnecter</>}
          </button>
          <button className="rounded-lg p-2 lg:hidden" onClick={() => setOpen(!open)} aria-label="Menu">
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
      {open && (
        <div className="border-t border-slate-100 bg-white px-4 py-3 lg:hidden">
          {navLinks.map(link => {
            const Icon = 'icon' in link ? link.icon : undefined;
            return (
              <button
                key={link.key}
                onClick={() => { navigate(link.key); setOpen(false); }}
                className={`flex w-full items-center gap-2 rounded-lg px-3 py-3 text-left text-sm font-semibold ${
                  active === link.key ? 'bg-orange-50 text-sonatrach' : 'text-slate-700'
                }`}
              >
                {Icon && <Icon size={16} />} {link.label}
              </button>
            );
          })}
          <button
            onClick={() => { navigate(admin ? 'dashboard' : 'home'); setOpen(false); }}
            className="mt-1 flex w-full items-center gap-2 rounded-lg border-t border-slate-100 px-3 py-3 text-left text-sm font-semibold text-slate-700"
          >
            {admin ? "Retour à l'espace travaux" : <><LogOut size={16} /> Déconnecter</>}
          </button>
        </div>
      )}
    </header>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-slate-800 bg-slate-950 text-slate-400">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 text-xs sm:grid-cols-2 lg:grid-cols-4 lg:px-8">
        <div>
          <img src={logo} alt="Sonatrach" className="h-16 w-auto rounded-md bg-white object-contain p-1.5" />
          <p className="mt-3 leading-relaxed">Activité Raffinage et Pétrochimie (RPA)<br />Direction Raffinage · Raffinerie d'Alger<br />Site Industriel de Sidi Arcine, Baraki.</p>
          <p className="mt-3 font-semibold text-sonatrach">Direction Maintenance</p>
        </div>
        <div>
          <p className="font-bold uppercase tracking-wider text-white">Support technique</p>
          <p className="mt-3 leading-6">Poste interne : 44-21 / 44-22<br />gmao.alger@sonatrach.dz<br />Bâtiment Maintenance, Bureau 104</p>
        </div>
        <div>
          <p className="font-bold uppercase tracking-wider text-white">Sécurité & réglementation</p>
          <p className="mt-3 leading-relaxed">Chaque intervention est soumise au Permis de Travail et à l'analyse de risques ATEX.</p>
          <span className="mt-3 inline-flex rounded border border-amber-800/60 bg-amber-950/40 px-2 py-1 text-amber-300">Zone industrielle classée Seveso</span>
        </div>
        <div>
          <p className="font-bold uppercase tracking-wider text-white">Statut du système</p>
          <p className="mt-3 flex justify-between">Base GMAO <span className="font-semibold text-emerald-400">Connectée</span></p>
          <p className="mt-1 flex justify-between">Version <span className="font-mono text-slate-300">v4.2.0-SDA</span></p>
          <p className="mt-1 flex justify-between">Accès <span className="text-slate-300">Intranet actif</span></p>
        </div>
      </div>
      <div className="border-t border-slate-800 px-4 py-5 text-center text-[11px] text-slate-500">© 2026 SONATRACH · Système de suivi des travaux de maintenance</div>
    </footer>
  );
}

export function AppShell({ active, children }: { active: PageKey; children: React.ReactNode }) {
  const admin = isAdminPage(active);
  return (
    <div className="min-h-screen bg-slate-50">
      {/* La barre supérieure noire reste masquée sur l'accueil pour un rendu institutionnel épuré. */}
      {active !== 'home' && <TopBar admin={admin} />}
      <Header active={active} />
      {children}
      <Footer />
    </div>
  );
}