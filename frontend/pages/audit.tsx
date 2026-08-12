import Head from 'next/head';
import { useEffect, useMemo, useState } from 'react';
import { ClipboardList } from 'lucide-react';
import AppShell from '../components/AppShell';
import RoleBadge from '../components/RoleBadge';
import { useLanguage } from '../lib/i18n';
import { api } from '../lib/api';
import { AuditEntry } from '../lib/types';
import { formatDateTime } from '../lib/utils';
import { cn } from '../lib/utils';

const ACTION_STYLES = (action: string): string => {
  if (action.toLowerCase().includes('accepted')) return 'text-green-700 bg-green-50 border-green-200';
  if (action.toLowerCase().includes('rejected')) return 'text-red-700 bg-red-50 border-red-200';
  if (action.toLowerCase().includes('flagged')) return 'text-amber-800 bg-amber-50 border-amber-200';
  return 'text-gray-700 bg-gray-50 border-gray-200';
};

export default function Audit() {
  const { t } = useLanguage();
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [moduleFilter, setModuleFilter] = useState('all');

  useEffect(() => {
    api.auditLog(200).then(setEntries);
  }, []);

  const modules = useMemo(() => {
    const set = new Set(entries.map((e) => e.module));
    return Array.from(set);
  }, [entries]);

  const filtered = useMemo(
    () => (moduleFilter === 'all' ? entries : entries.filter((e) => e.module === moduleFilter)),
    [entries, moduleFilter]
  );

  return (
    <AppShell title={t('audit.title')} subtitle={t('audit.subtitle')}>
      <Head>
        <title>{t('audit.title')} · {t('app.name')}</title>
      </Head>
      <div className="p-6 space-y-4">
        <div className="card flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">
              {filtered.length} {filtered.length === 1 ? 'entry' : 'entries'}
            </span>
          </div>
          <select value={moduleFilter} onChange={(e) => setModuleFilter(e.target.value)} className="input-field sm:max-w-xs sm:ml-auto">
            <option value="all">{t('audit.filterAll')}</option>
            {modules.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        <div className="card overflow-x-auto p-0">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/60 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                <th className="px-4 py-3">{t('audit.timestamp')}</th>
                <th className="px-4 py-3">{t('audit.actor')}</th>
                <th className="px-4 py-3">{t('audit.module')}</th>
                <th className="px-4 py-3">{t('audit.action')}</th>
                <th className="px-4 py-3">{t('audit.target')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((entry) => (
                <tr key={entry.id} className="hover:bg-gray-50/40 transition-colors align-top">
                  <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{formatDateTime(entry.timestamp)}</td>
                  <td className="px-4 py-3">
                    <p className="text-xs font-medium text-gray-900">{entry.actorName}</p>
                    <RoleBadge role={entry.actorRole} className="mt-1" />
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">{entry.module}</td>
                  <td className="px-4 py-3">
                    <span className={cn('text-[11px] font-semibold px-2 py-0.5 rounded-full border whitespace-nowrap', ACTION_STYLES(entry.action))}>
                      {entry.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600 max-w-xs">
                    <p>{entry.target}</p>
                    {entry.details && <p className="text-gray-400 mt-0.5">{entry.details}</p>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
