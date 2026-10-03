import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { Bell, FileText, Home, LogOut, Mail, Menu, ShieldCheck, X, Factory, Users, Building2, History as HistoryIcon } from 'lucide-react';
import { Brand } from '@/components/Brand';
import logo from '@/assets/sonatrach-logo.png';
import { getSessionUser, logout, subscribeSession, userInitials } from '@/session';
import type { LucideIcon } from 'lucide-react';
import { deleteAllNotifications, deleteNotification, listNotifications, type AppNotification } from '@/notifications';
import { acceptInterim, declineInterim } from '@/interims';
import { refreshSession } from '@/session';

export const sonatrachLogo = logo;
// 1. Ajout de 'profile' au type PageKey
export type PageKey =
  | 'home' | 'login' | 'dashboard' | 'orders' | 'new-order'
  | 'admin-users' | 'admin-user-form' | 'admin-user-detail' | 'admin-org'
  | 'profile'; 

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
  const navLinks = admin
    ? adminLinks
    : [
        ...links.filter(link => link.key !== 'home'),
        ...(user.isAdmin ? [{ key: 'admin-users' as PageKey, label: 'Administration' }] : []),
      ];

  // 2) vraie déconnexion
  const onLogout = async () => { await logout(); navigate('login'); };
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
          <div className="hidden sm:block">
  <NotificationBell />
</div>
          
          {/* 2. Remplacement de la carte d'identité par un bouton cliquable */}
          <button onClick={() => navigate('profile')} className="hidden items-center gap-3 rounded-lg px-2 py-1 text-right transition hover:bg-slate-100 sm:flex">
            <div>
              <p className="text-xs font-bold text-slate-900">{user.name}</p>
              <p className="text-[11px] font-medium text-slate-500">{user.role}</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full border border-orange-200 bg-orange-50 text-xs font-bold text-sonatrach">
              {userInitials(user.name)}
            </div>
          </button>

          {/* Retour à l'espace travaux depuis l'admin, sinon déconnexion normale. */}
          <button
            onClick={() => {
              if (admin && user.hasRole) navigate('dashboard');
              else void onLogout();
            }}
            className="hidden items-center gap-2 rounded-lg border border-slate-200 px-3.5 py-2 text-sm font-semibold text-slate-600 transition hover:border-orange-200 hover:bg-orange-50 hover:text-sonatrach lg:inline-flex"
          >
            {admin && user.hasRole ? <>Retour à l'espace travaux</> : <><LogOut size={16} /> Déconnecter</>}
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
            onClick={() => {
              setOpen(false);
              if (admin && user.hasRole) navigate('dashboard');
              else void onLogout();
            }}
            className="mt-1 flex w-full items-center gap-2 rounded-lg border-t border-slate-100 px-3 py-3 text-left text-sm font-semibold text-slate-700"
          >
            {admin && user.hasRole ? "Retour à l'espace travaux" : <><LogOut size={16} /> Déconnecter</>}
          </button>
        </div>
      )}
    </header>
  );
}

function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AppNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  async function load() {
    try {
      const { notifications, unreadCount } = await listNotifications();
      setItems(notifications);
      setUnread(unreadCount);
    } catch { /* silencieux : ne bloque pas l'UI */ }
  }

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => { void load(); }, 30000); // rafraîchit toutes les 30s
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  async function onOpenItem(n: AppNotification) {
  if (n.type === 'interim_response_needed' && !n.read) return;
  const link = n.link;
  setItems((prev) => prev.filter((i) => i.id !== n.id));
  if (!n.read) setUnread((u) => Math.max(0, u - 1));
  setOpen(false);
  try { await deleteNotification(n.id); } catch { /* déjà retirée visuellement, tant pis si l'appel échoue */ }
  if (link) navigate(link);
}

  /*async function respondInterim(n: AppNotification, action: 'accept' | 'decline') {
    if (!n.entityId) return;
    try {
      if (action === 'accept') await acceptInterim(n.entityId);
      else await declineInterim(n.entityId);
      await markNotificationRead(n.id);
      setItems((prev) => prev.filter((i) => i.id !== n.id));
      setUnread((u) => Math.max(0, u - 1));
      await refreshSession();
    } catch {
      
    }
  }*/
 async function respondInterim(n: AppNotification, action: 'accept' | 'decline') {
  if (!n.entityId) return;
  try {
    if (action === 'accept') await acceptInterim(n.entityId);
    else await declineInterim(n.entityId);
    await deleteNotification(n.id);
    setItems((prev) => prev.filter((i) => i.id !== n.id));
    setUnread((u) => Math.max(0, u - 1));
    await refreshSession();
  } catch {
    /* l'erreur reste silencieuse ici, la liste se rafraîchira au prochain cycle */
  }
}

  async function onClearAll() {
  await deleteAllNotifications();
  setItems([]);
  setUnread(0);
}

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((v) => !v)} className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100">
        <Bell size={19} />
        {unread > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-sonatrach px-1 text-[9px] font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <p className="text-sm font-bold text-slate-900">Notifications</p>
            {items.length > 0 && (
            <button onClick={onClearAll} className="text-xs font-semibold text-sonatrach hover:underline">
             Tout effacer
             </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 && <p className="px-4 py-8 text-center text-sm text-slate-400">Aucune notification.</p>}
            {items.map((n) => (
               n.type === 'interim_response_needed' && !n.read ? (
                <div key={n.id} className="border-b border-slate-50 bg-orange-50/40 px-4 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-900">{n.title}</span>
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-sonatrach" />
                  </div>
                  <p className="mt-0.5 text-[11px] leading-5 text-slate-600">{n.message}</p>
                  <div className="mt-2 flex gap-2">
                    <button onClick={() => respondInterim(n, 'accept')} className="rounded-md bg-emerald-600 px-3 py-1 text-[11px] font-bold text-white hover:bg-emerald-700">
                      Accepter
                    </button>
                    <button onClick={() => respondInterim(n, 'decline')} className="rounded-md border border-red-300 px-3 py-1 text-[11px] font-bold text-red-600 hover:bg-red-50">
                      Refuser
                    </button>
                  </div>
                  <span className="mt-1.5 block text-[10px] text-slate-400">{new Date(n.createdAt).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}</span>
                </div>
              ) : (
                <button
                  key={n.id}
                  onClick={() => onOpenItem(n)}
                  className={`flex w-full flex-col items-start gap-0.5 border-b border-slate-50 px-4 py-3 text-left transition hover:bg-slate-50 ${!n.read ? 'bg-orange-50/40' : ''}`}
                >
                  <div className="flex w-full items-center justify-between gap-2">
                    <span className={`text-xs font-bold ${!n.read ? 'text-slate-900' : 'text-slate-600'}`}>{n.title}</span>
                    {!n.read && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-sonatrach" />}
                  </div>
                  <span className="text-[11px] leading-5 text-slate-500">{n.message}</span>
                  <span className="text-[10px] text-slate-400">{new Date(n.createdAt).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}</span>
                </button>
              )
            ))}
          </div>
        </div>
      )}
    </div>
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