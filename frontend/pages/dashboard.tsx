import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import {
  FileClock,
  ShieldAlert,
  Copy,
  Library,
  MessagesSquare,
  Scale,
  ArrowRight,
} from 'lucide-react';
import AppShell from '../components/AppShell';
import StatCard from '../components/StatCard';
import SeverityBadge from '../components/SeverityBadge';
import { useLanguage } from '../lib/i18n';
import { api } from '../lib/api';
import { formatDate } from '../lib/utils';
import { Bill, GapIssue, GapSeverity } from '../lib/types';

const SEVERITY_COLORS: Record<GapSeverity, string> = {
  critical: '#dc2626',
  moderate: '#d97706',
  minor: '#2563eb',
};

const STATUS_LABEL: Record<string, string> = {
  draft: 'Draft',
  in_committee: 'In Committee',
  first_reading: 'First Reading',
  enacted: 'Enacted',
};

export default function Dashboard() {
  const { t } = useLanguage();
  const router = useRouter();

  const [draftBills, setDraftBills] = useState<Bill[]>([]);
  const [pendingIssues, setPendingIssues] = useState<GapIssue[]>([]);
  const [duplicationCount, setDuplicationCount] = useState(0);
  const [lawsInForce, setLawsInForce] = useState<number | null>(null);
  const [auditCount, setAuditCount] = useState(0);

  // Aggregate live stats from the backend: drafts, real corpus size, audit
  // volume, and gap/duplication analysis run across every draft bill.
  useEffect(() => {
    (async () => {
      const [drafts, health, audit] = await Promise.all([
        api.listDrafts(),
        api.health(),
        api.auditLog(500),
      ]);
      setDraftBills(drafts);
      setLawsInForce(health.laws_in_force ?? null);
      setAuditCount(audit.length);

      const [gapResults, dupResults] = await Promise.all([
        Promise.all(drafts.map((b) => api.gaps(b.id))),
        Promise.all(drafts.map((b) => api.duplication(b.id))),
      ]);
      setPendingIssues(gapResults.flatMap((r) => r.issues).filter((i) => i.status === 'pending'));
      setDuplicationCount(dupResults.reduce((n, o) => n + o.length, 0));
    })();
  }, []);

  const criticalPending = pendingIssues.filter((i) => i.severity === 'critical');

  const severityChartData = useMemo(() => {
    const counts: Record<GapSeverity, number> = { critical: 0, moderate: 0, minor: 0 };
    pendingIssues.forEach((i) => {
      counts[i.severity] += 1;
    });
    return [
      { name: t('common.critical'), value: counts.critical, severity: 'critical' as GapSeverity },
      { name: t('common.moderate'), value: counts.moderate, severity: 'moderate' as GapSeverity },
      { name: t('common.minor'), value: counts.minor, severity: 'minor' as GapSeverity },
    ];
  }, [pendingIssues, t]);

  const recentAuditCount = auditCount;

  const modules = [
    {
      href: '/assistant',
      icon: MessagesSquare,
      title: t('nav.assistant'),
      description: 'Chat over the knowledge base with cited answers.',
    },
    {
      href: '/duplication',
      icon: Copy,
      title: t('nav.duplication'),
      description: 'Find overlapping or contradictory provisions.',
    },
    {
      href: '/gaps',
      icon: ShieldAlert,
      title: t('nav.gaps'),
      description: 'Review annotated bill text and flagged issues.',
    },
    {
      href: '/comparative',
      icon: Scale,
      title: t('nav.comparative'),
      description: 'Benchmark against other countries’ laws.',
    },
  ];

  return (
    <AppShell title={t('dashboard.title')} subtitle={t('dashboard.subtitle')}>
      <Head>
        <title>{t('dashboard.title')} · {t('app.name')}</title>
      </Head>
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard icon={FileClock} label={t('dashboard.billsInProgress')} value={draftBills.length} accent="primary" />
          <StatCard
            icon={ShieldAlert}
            label={t('dashboard.pendingIssues')}
            value={pendingIssues.length}
            hint={`${criticalPending.length} critical`}
            accent="red"
          />
          <StatCard icon={Copy} label={t('dashboard.duplicationFlags')} value={duplicationCount} accent="accent" />
          <StatCard
            icon={Library}
            label="Laws in force (corpus)"
            value={lawsInForce ?? '…'}
            hint="amategeko.gov.rw"
            accent="blue"
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="section-title">{t('dashboard.recentBills')}</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {draftBills.map((bill) => (
                <div key={bill.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{bill.title}</p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                      <span className="px-2 py-0.5 rounded-full bg-gray-50 text-gray-700 font-medium">
                        {STATUS_LABEL[bill.status]}
                      </span>
                      <span>
                        {t('common.lastUpdated')}: {formatDate(bill.lastUpdated)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => router.push(`/gaps?bill=${bill.id}`)}
                      className="btn-ghost text-xs px-2.5 py-1.5"
                    >
                      {t('nav.gaps')}
                    </button>
                    <button
                      onClick={() => router.push(`/duplication?bill=${bill.id}`)}
                      className="btn-ghost text-xs px-2.5 py-1.5"
                    >
                      {t('nav.duplication')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h2 className="section-title mb-4">{t('dashboard.issuesBySeverity')}</h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={severityChartData} layout="vertical" margin={{ left: 0, right: 12 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="name" width={70} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {severityChartData.map((entry) => (
                    <Cell key={entry.severity} fill={SEVERITY_COLORS[entry.severity]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h2 className="section-title mb-4">{t('dashboard.needsReview')}</h2>
          <div className="space-y-3">
            {pendingIssues.slice(0, 5).map((issue) => (
              <button
                key={issue.id}
                onClick={() => router.push(`/gaps?bill=${issue.billId}`)}
                className="w-full flex items-center justify-between gap-4 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 text-left transition-colors"
              >
                <div className="min-w-0 flex items-center gap-3">
                  <SeverityBadge severity={issue.severity} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{issue.title}</p>
                    <p className="text-xs text-gray-500 truncate">
                      {issue.articleRef} · {issue.category}
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
              </button>
            ))}
          </div>
        </div>

        <div>
          <h2 className="section-title mb-4">{t('dashboard.quickLinks')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {modules.map((mod) => (
              <button
                key={mod.href}
                onClick={() => router.push(mod.href)}
                className="card text-left hover:shadow-md hover:border-primary-300 transition-all group"
              >
                <div className="w-10 h-10 rounded-lg bg-primary-600 text-white flex items-center justify-center mb-3 group-hover:bg-primary-700 transition-colors">
                  <mod.icon className="w-5 h-5" />
                </div>
                <p className="text-sm font-semibold text-gray-900">{mod.title}</p>
                <p className="text-xs text-gray-500 mt-1">{mod.description}</p>
                <span className="inline-flex items-center gap-1 text-xs font-medium text-primary-700 mt-3">
                  {t('common.openModule')} <ArrowRight className="w-3 h-3" />
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
