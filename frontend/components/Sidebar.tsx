import { useRouter } from 'next/router';
import Image from 'next/image';
import {
  LayoutDashboard,
  MessagesSquare,
  Copy,
  ShieldAlert,
  Scale,
  ClipboardList,
  Settings,
  LogOut,
} from 'lucide-react';
import { AuthUser, logout } from '../lib/auth';
import { useLanguage } from '../lib/i18n';
import { cn } from '../lib/utils';

interface NavItem {
  href: string;
  labelKey: string;
  icon: typeof LayoutDashboard;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', labelKey: 'nav.dashboard', icon: LayoutDashboard },
  { href: '/assistant', labelKey: 'nav.assistant', icon: MessagesSquare },
  { href: '/duplication', labelKey: 'nav.duplication', icon: Copy },
  { href: '/gaps', labelKey: 'nav.gaps', icon: ShieldAlert },
  { href: '/comparative', labelKey: 'nav.comparative', icon: Scale },
  { href: '/audit', labelKey: 'nav.audit', icon: ClipboardList },
];

interface SidebarProps {
  user: AuthUser;
  mobileOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ user, mobileOpen = false, onClose }: SidebarProps) {
  const router = useRouter();
  const { t } = useLanguage();
  void user;

  const handleSignOut = () => {
    logout();
    router.push('/login');
  };

  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={onClose} />
      )}
      <aside
        className={cn(
          'fixed top-0 left-0 z-40 h-full transition-transform duration-300 overflow-y-auto',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          'w-64 bg-white border-r border-gray-200 shadow-xl',
          'lg:static lg:flex-shrink-0'
        )}
      >
        <div className="flex flex-col min-h-full">
          {/* Logo block: centered column, matching the reference app */}
          <div className="flex flex-col items-center justify-center px-6 py-6 border-b border-gray-200 flex-shrink-0">
            <div className="w-12 h-12 mb-2">
              <Image
                src="/rwanda-coat-of-arms.png"
                alt="Rwanda Coat of Arms"
                width={48}
                height={48}
                className="w-full h-full object-contain"
              />
            </div>
            <h1 className="text-lg font-bold text-gray-900 text-center leading-tight">{t('app.name')}</h1>
            <p className="text-xs text-gray-500 text-center mt-1">{t('app.shortName')}</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1">
            {NAV_ITEMS.map((item) => {
              const isActive = router.pathname === item.href;
              const Icon = item.icon;
              return (
                <button
                  key={item.href}
                  onClick={() => {
                    router.push(item.href);
                    onClose?.();
                  }}
                  className={cn(
                    'flex items-center justify-between w-full px-4 py-3 rounded-lg transition-all text-left',
                    isActive
                      ? 'bg-primary-50 text-primary-700 shadow-sm border border-primary-100'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  )}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={cn('h-5 w-5', isActive ? 'text-primary-600' : 'text-gray-500')} />
                    <span className="text-sm font-medium">{t(item.labelKey)}</span>
                  </div>
                </button>
              );
            })}
          </nav>

          <div className="p-3 border-t border-gray-200 flex-shrink-0 space-y-1">
            <button
              onClick={() => router.push('/settings')}
              className="flex items-center w-full px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-all"
            >
              <Settings className="h-5 w-5 mr-3" />
              <span className="text-sm font-medium">{t('topbar.settings')}</span>
            </button>
            <button
              onClick={handleSignOut}
              className="flex items-center w-full px-4 py-3 text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-lg transition-all"
            >
              <LogOut className="h-5 w-5 mr-3" />
              <span className="text-sm font-medium">{t('topbar.signOut')}</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
