import { useEffect, useState, useSyncExternalStore } from 'react';
import { DashboardPage } from '@/pages/DashboardPage';
import { LandingPage } from '@/pages/LandingPage';
import { LoginPage } from '@/pages/LoginPage';
import { NewWorkOrderPage } from '@/pages/NewWorkOrderPage';
import { WorkOrderDetailPage } from '@/pages/WorkOrderDetailPage';
import { WorkOrdersPage } from '@/pages/WorkOrdersPage';
import { AdminUsersPage } from '@/pages/admin/AdminUsersPage';
import { AdminUserFormPage } from '@/pages/admin/AdminUserFormPage';
import { AdminUserDetailPage } from '@/pages/admin/AdminUserDetailPage';
import { AdminOrgStructurePage } from '@/pages/admin/AdminOrgStructurePage';
import { AppShell, navigate } from '@/components/Shell';
import { getSessionUser, isLoggedIn, refreshSession, subscribeSession } from '@/session';

function getPath() { return window.location.pathname.replace(/^\//, ''); }

function Forbidden() {
  return (
    <AppShell active="dashboard">
      <main className="industrial-grid min-h-[calc(100vh-200px)]">
        <div className="mx-auto max-w-md px-4 py-20 text-center">
          <h1 className="heading text-2xl font-extrabold text-slate-950">Accès refusé</h1>
          <p className="mt-2 text-sm text-slate-600">Cette section est réservée aux administrateurs.</p>
          <button onClick={() => navigate('dashboard')} className="mt-6 rounded-lg bg-slate-900 px-5 py-3 text-sm font-bold text-white">
            Retour au tableau de bord
          </button>
        </div>
      </main>
    </AppShell>
  );
}

function App() {
  const [path, setPath] = useState(getPath());
  const user = useSyncExternalStore(subscribeSession, getSessionUser);

  useEffect(() => {
    const onPopState = () => setPath(getPath());
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => { void refreshSession(); }, []);

  useEffect(() => {
    document.title = path.startsWith('orders/') ? 'Détail du travail | Sonatrach'
      : path === 'dashboard' ? 'Tableau de bord | Sonatrach'
      : path === 'orders' ? 'Ordres de travail | Sonatrach'
      : path === 'new-order' ? 'Nouveau travail | Sonatrach'
      : path.startsWith('admin') ? 'Administration | Sonatrach'
      : 'Maintenance Raffinerie d’Alger | Sonatrach';
  }, [path]);

  const isPublic = path === '' || path === 'login';
  const authed = isLoggedIn();

  useEffect(() => {
    if (!isPublic && !authed) navigate('login');
  }, [isPublic, authed]);

  if (path === 'login') return <LoginPage />;
  if (!isPublic && !authed) return null;                       // redirection en cours
  if (path.startsWith('admin') && !user.isAdmin) return <Forbidden />;

  if (path === 'dashboard') return <DashboardPage />;
  if (path.startsWith('orders/')) return <WorkOrderDetailPage key={path} id={decodeURIComponent(path.slice('orders/'.length))} />;
  if (path === 'orders') return <WorkOrdersPage />;
  if (path === 'new-order') return <NewWorkOrderPage />;

  if (path === 'admin-users') return <AdminUsersPage />;
  if (path.startsWith('admin-user-form')) return <AdminUserFormPage />;
  if (path.startsWith('admin-user-detail/')) return <AdminUserDetailPage />;
  if (path === 'admin-org') return <AdminOrgStructurePage />;

  return <LandingPage />;
}

export default App;