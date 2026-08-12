import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { AuthUser, getCurrentUser } from '../lib/auth';
import { useLanguage } from '../lib/i18n';

interface AppShellProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

// Shared dashboard chrome (sidebar + top bar) plus a lightweight client-side
// auth guard. Every protected page renders through this shell so the
// header/sidebar stay consistent across the app.
export default function AppShell({ children, title, subtitle }: AppShellProps) {
  const router = useRouter();
  const { t } = useLanguage();
  const [user, setUser] = useState<AuthUser | null | undefined>(undefined);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    const current = getCurrentUser();
    if (!current) {
      router.replace('/login');
      return;
    }
    setUser(current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.pathname]);

  if (user === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500 text-sm animate-pulse">Loading Parliament AI System...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="h-screen flex bg-gray-50 overflow-hidden">
      <Sidebar user={user} mobileOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar user={user} onMenuClick={() => setMobileNavOpen(true)} />
        <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="px-6 pt-6 pb-1 flex-shrink-0">
            <h1 className="text-4xl font-bold text-gray-900">{title}</h1>
            {subtitle && <p className="mt-1 text-lg text-gray-600">{subtitle}</p>}
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto animate-fade-in">{children}</div>
        </main>
        <footer className="flex-shrink-0 border-t border-gray-200 bg-white px-6 py-2">
          <p className="text-xs text-gray-400">{t('app.demoNotice')}</p>
        </footer>
      </div>
    </div>
  );
}
