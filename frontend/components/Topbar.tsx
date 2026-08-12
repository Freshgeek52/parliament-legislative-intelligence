import { useState } from 'react';
import { Bell, Search, Languages, Check, Menu } from 'lucide-react';
import { AuthUser } from '../lib/auth';
import { Language, LANGUAGE_LABELS, useLanguage } from '../lib/i18n';
import RoleBadge from './RoleBadge';
import { cn } from '../lib/utils';

interface TopbarProps {
  user: AuthUser;
  onMenuClick?: () => void;
}

const LANGUAGES: Language[] = ['en', 'fr', 'rw'];

const initials = (name: string): string =>
  name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

export default function Topbar({ user, onMenuClick }: TopbarProps) {
  const { lang, setLang, t } = useLanguage();
  const [langOpen, setLangOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6 flex-shrink-0">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onMenuClick}
          className="p-2 hover:bg-gray-100 rounded-lg transition lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="w-6 h-6 text-gray-600" />
        </button>

        <div className="hidden xl:flex relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder={t('topbar.search')}
            className="pl-9 pr-3 py-2 w-64 text-sm border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="flex items-center space-x-2 ml-auto">
        {/* Language switcher: functional, backed by lib/i18n dictionary */}
        <div className="relative">
          <button
            onClick={() => setLangOpen((v) => !v)}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 transition"
            aria-label={t('topbar.language')}
          >
            <Languages className="w-4 h-4" />
            <span className="uppercase">{lang}</span>
          </button>
          {langOpen && (
            <div className="absolute right-0 mt-1 w-44 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-20 animate-fade-in">
              {LANGUAGES.map((code) => (
                <button
                  key={code}
                  onClick={() => {
                    setLang(code);
                    setLangOpen(false);
                  }}
                  className={cn(
                    'flex items-center justify-between w-full px-3 py-2 text-sm text-left hover:bg-gray-50',
                    lang === code ? 'text-gray-900 font-semibold' : 'text-gray-600'
                  )}
                >
                  {LANGUAGE_LABELS[code]}
                  {lang === code && <Check className="w-4 h-4 text-primary-600" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Notifications */}
        <button
          className="relative p-2 hover:bg-gray-100 rounded-lg transition"
          aria-label={t('topbar.notifications')}
        >
          <Bell className="w-5 h-5 text-gray-600" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        {/* Account identity: sign out lives in the sidebar, not duplicated here */}
        <div className="flex items-center gap-2 pl-1.5 pr-2 sm:pr-2.5 py-1.5">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-gray-900 leading-tight">{user.name}</p>
            <RoleBadge role={user.role} className="mt-0.5" />
          </div>
          <div className="w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center text-xs font-semibold flex-shrink-0">
            {initials(user.name)}
          </div>
        </div>
      </div>
    </header>
  );
}
