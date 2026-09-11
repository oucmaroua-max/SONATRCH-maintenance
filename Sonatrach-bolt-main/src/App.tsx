import { useEffect, useState } from 'react';
import { DashboardPage } from '@/pages/DashboardPage';
import { LandingPage } from '@/pages/LandingPage';
import { LoginPage } from '@/pages/LoginPage';
import { NewWorkOrderPage } from '@/pages/NewWorkOrderPage';
import { WorkOrderDetailPage } from '@/pages/WorkOrderDetailPage';
import { WorkOrdersPage } from '@/pages/WorkOrdersPage';

function getPath() { return window.location.pathname.replace(/^\//, ''); }

function App() {
  const [path, setPath] = useState(getPath());
  useEffect(() => { const onPopState = () => setPath(getPath()); window.addEventListener('popstate', onPopState); return () => window.removeEventListener('popstate', onPopState); }, []);
  useEffect(() => {
    document.title = path.startsWith('orders/')
      ? 'Détail du travail | Sonatrach'
      : path === 'dashboard'
        ? 'Tableau de bord | Sonatrach'
        : path === 'orders'
          ? 'Ordres de travail | Sonatrach'
          : path === 'new-order'
            ? 'Nouveau travail | Sonatrach'
            : 'Maintenance Raffinerie d’Alger | Sonatrach';
  }, [path]);
  if (path === 'login') return <LoginPage />;
  if (path === 'dashboard') return <DashboardPage />;
  if (path.startsWith('orders/')) return <WorkOrderDetailPage key={path} id={decodeURIComponent(path.slice('orders/'.length))} />;
  if (path === 'orders') return <WorkOrdersPage />;
  if (path === 'new-order') return <NewWorkOrderPage />;
  return <LandingPage />;
}

export default App;
