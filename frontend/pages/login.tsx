import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Image from 'next/image';
import { toast } from 'react-hot-toast';
import {
  Gavel,
  ScrollText,
  Search,
  ShieldCheck,
  Check,
  Languages,
} from 'lucide-react';
import { isAuthenticated, login } from '../lib/auth';
import { Role } from '../lib/types';
import { ROLE_LABELS, ROLE_DESCRIPTIONS } from '../lib/auth';
import { Language, useLanguage } from '../lib/i18n';
import { cn } from '../lib/utils';

const ROLE_ORDER: Role[] = ['mp', 'legal_drafter', 'research_staff', 'oversight_unit'];

const ROLE_ICONS: Record<Role, typeof Gavel> = {
  mp: Gavel,
  legal_drafter: ScrollText,
  research_staff: Search,
  oversight_unit: ShieldCheck,
};

export default function Login() {
  const router = useRouter();
  const { lang, setLang, t } = useLanguage();
  const [selectedRole, setSelectedRole] = useState<Role>('legal_drafter');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated()) {
      router.replace('/dashboard');
    }
  }, [router]);

  const handleContinue = async () => {
    setIsLoading(true);
    try {
      const result = await login(selectedRole);
      if (result.success) {
        toast.success(`${t('login.selectedRole')}: ${ROLE_LABELS[selectedRole]}`);
        router.push('/dashboard');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>{t('login.title')}</title>
      </Head>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center px-4 py-10 relative">
        <div className="absolute top-4 right-4">
          <div className="flex items-center gap-1 bg-white border border-gray-200 shadow-sm rounded-full px-2 py-1">
            <Languages className="w-3.5 h-3.5 text-gray-400 ml-1" />
            {(['en', 'fr', 'rw'] as Language[]).map((code) => (
              <button
                key={code}
                onClick={() => setLang(code)}
                className={cn(
                  'px-2.5 py-1 text-xs font-semibold rounded-full uppercase transition-colors',
                  lang === code ? 'bg-primary-600 text-white' : 'text-gray-500 hover:text-gray-900'
                )}
              >
                {code}
              </button>
            ))}
          </div>
        </div>

        <div className="w-full max-w-3xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 mb-4">
              <Image
                src="/rwanda-coat-of-arms.png"
                alt="Rwanda Coat of Arms"
                width={64}
                height={64}
                className="w-full h-full object-contain"
                priority
              />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">{t('app.name')}</h1>
            <p className="mt-2 text-sm text-gray-600">{t('app.tagline')}</p>
            <p className="mt-1 text-xs text-gray-400">{t('app.partner')}</p>
          </div>

          <div className="bg-white py-10 px-6 md:px-8 shadow-xl rounded-2xl border border-gray-100">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">{t('login.title')}</h2>
              <p className="mt-1 text-sm text-gray-600">{t('login.subtitle')}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {ROLE_ORDER.map((role) => {
                const Icon = ROLE_ICONS[role];
                const isSelected = selectedRole === role;
                return (
                  <button
                    key={role}
                    onClick={() => setSelectedRole(role)}
                    className={cn(
                      'text-left rounded-xl border-2 p-4 transition-all duration-150',
                      isSelected
                        ? 'border-primary-600 bg-primary-50 shadow-sm'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div
                        className={cn(
                          'w-10 h-10 rounded-lg flex items-center justify-center',
                          isSelected ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600'
                        )}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-primary-600 flex items-center justify-center flex-shrink-0">
                          <Check className="w-3.5 h-3.5 text-white" />
                        </div>
                      )}
                    </div>
                    <p className="mt-3 font-semibold text-gray-900 text-sm">{ROLE_LABELS[role]}</p>
                    <p className="mt-1 text-xs text-gray-500 leading-relaxed">{ROLE_DESCRIPTIONS[role]}</p>
                  </button>
                );
              })}
            </div>

            <button
              onClick={handleContinue}
              disabled={isLoading}
              className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-6 flex items-center justify-center text-base"
            >
              {isLoading ? t('login.signingIn') : t('login.continue')}
            </button>

            <p className="mt-4 text-center text-xs text-gray-400">
              Mock institutional sign-in. No password required. Selecting a role signs you in as a demo user with
              that role.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
