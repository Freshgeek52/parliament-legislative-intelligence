import Head from 'next/head';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'react-hot-toast';
import { CheckCircle2, Flag, GitCompareArrows, Lock } from 'lucide-react';
import AppShell from '../components/AppShell';
import { useLanguage } from '../lib/i18n';
import { api } from '../lib/api';
import { Bill, DuplicationOverlap } from '../lib/types';
import { canModifySuggestions, getCurrentUser } from '../lib/auth';
import { cn, similarityTier } from '../lib/utils';

// Overlaps returned by the backend are self-contained (they carry the draft
// and matched article text), so the comparison panel needs no extra lookups.
type EnrichedOverlap = DuplicationOverlap & {
  draftBillTitle: string;
  draftArticleHeading: string;
  draftArticleText: string;
  matchedLawTitle: string;
  matchedArticleText: string;
};

const TIER_STYLES: Record<'high' | 'moderate' | 'low', string> = {
  high: 'bg-red-50 text-red-700 border-red-200',
  moderate: 'bg-amber-50 text-amber-700 border-amber-200',
  low: 'bg-blue-50 text-blue-700 border-blue-200',
};

const TIER_BAR: Record<'high' | 'moderate' | 'low', string> = {
  high: 'bg-red-500',
  moderate: 'bg-amber-500',
  low: 'bg-blue-500',
};

const OVERLAP_TYPE_LABEL: Record<DuplicationOverlap['overlapType'], string> = {
  duplicate: 'Duplicate',
  contradictory: 'Contradictory',
  redundant: 'Redundant',
  overlapping: 'Overlapping',
};

export default function Duplication() {
  const { t } = useLanguage();
  const router = useRouter();
  const user = getCurrentUser();
  const canModify = user ? canModifySuggestions(user.role) : false;

  const [drafts, setDrafts] = useState<Bill[]>([]);
  const [selectedBillId, setSelectedBillId] = useState('');
  const [overlaps, setOverlaps] = useState<EnrichedOverlap[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedOverlapId, setSelectedOverlapId] = useState<string | null>(null);
  const [reviewedIds, setReviewedIds] = useState<Set<string>>(new Set());

  // Load the list of draft bills from the backend.
  useEffect(() => {
    api.listDrafts().then((d) => {
      setDrafts(d);
      const queryBill = router.query.bill;
      const initial = typeof queryBill === 'string' && d.some((b) => b.id === queryBill)
        ? queryBill
        : d[0]?.id ?? '';
      setSelectedBillId(initial);
    });
  }, [router.query.bill]);

  // Run duplication detection against the real corpus when the bill changes.
  useEffect(() => {
    if (!selectedBillId) return;
    setLoading(true);
    setSelectedOverlapId(null);
    api.duplication(selectedBillId).then((o) => {
      setOverlaps(o as EnrichedOverlap[]);
      setLoading(false);
    });
  }, [selectedBillId]);

  const selectedOverlap = overlaps.find((o) => o.id === selectedOverlapId) ?? overlaps[0] ?? null;
  const bill = drafts.find((b) => b.id === selectedBillId);

  const handleAction = (overlap: EnrichedOverlap, action: 'reviewed' | 'flagged') => {
    if (!user) return;
    setReviewedIds((prev) => new Set(prev).add(overlap.id));
    api.postAudit({
      actorRole: user.role,
      module: 'Duplication Detection',
      action: action === 'reviewed' ? 'Overlap marked reviewed' : 'Overlap flagged for revision',
      target: `${overlap.draftBillTitle} Art. ${overlap.draftArticleNumber} vs ${overlap.matchedLawTitle} Art. ${overlap.matchedArticleNumber}`,
    });
    toast.success(action === 'reviewed' ? t('duplication.markReviewed') : t('duplication.flagForRevision'));
  };

  return (
    <AppShell title={t('duplication.title')} subtitle={t('duplication.subtitle')}>
      <Head>
        <title>{t('duplication.title')} · {t('app.name')}</title>
      </Head>
      <div className="p-6 space-y-6">
        <div className="card flex flex-col sm:flex-row sm:items-center gap-3">
          <label className="text-sm font-medium text-gray-700 flex-shrink-0">
            {t('duplication.selectBillLabel')}
          </label>
          <select
            value={selectedBillId}
            onChange={(e) => {
              setSelectedBillId(e.target.value);
              setSelectedOverlapId(null);
            }}
            className="input-field sm:max-w-md"
          >
            {drafts.map((b) => (
              <option key={b.id} value={b.id}>
                {b.title}
              </option>
            ))}
          </select>
          {bill && <p className="text-xs text-gray-500 sm:ml-auto">{bill.summary}</p>}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <h2 className="section-title mb-4">
              {t('duplication.overlaps')}{' '}
              <span className="text-gray-400 font-normal">
                ({loading ? '…' : overlaps.length})
              </span>
            </h2>
            {!loading && overlaps.length === 0 && (
              <p className="text-sm text-gray-500">
                No overlaps with laws in force were found above the similarity threshold.
              </p>
            )}
            <div className="space-y-3">
              {overlaps.map((overlap) => {
                const tier = similarityTier(overlap.similarity);
                const isSelected = selectedOverlap?.id === overlap.id;
                const isReviewed = reviewedIds.has(overlap.id);
                return (
                  <button
                    key={overlap.id}
                    onClick={() => setSelectedOverlapId(overlap.id)}
                    className={cn(
                      'w-full text-left rounded-lg border p-3.5 transition-colors',
                      isSelected ? 'border-primary-600 bg-primary-50' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full border', TIER_STYLES[tier])}>
                        {overlap.similarity}% {t('duplication.similarity')}
                      </span>
                      <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">
                        {OVERLAP_TYPE_LABEL[overlap.overlapType]}
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                      <div className={cn('h-full rounded-full', TIER_BAR[tier])} style={{ width: `${overlap.similarity}%` }} />
                    </div>
                    <p className="mt-2 text-sm text-gray-800">
                      Art. {overlap.draftArticleNumber} <span className="text-gray-400">vs</span> {overlap.matchedLawTitle} Art.{' '}
                      {overlap.matchedArticleNumber}
                    </p>
                    <p className="mt-1 text-xs text-gray-500 line-clamp-2">{overlap.summary}</p>
                    {isReviewed && (
                      <span className="inline-flex items-center gap-1 mt-2 text-[11px] font-medium text-gray-500">
                        <CheckCircle2 className="w-3 h-3" /> Logged to audit trail
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <GitCompareArrows className="w-4 h-4 text-gray-500" />
              <h2 className="section-title">{t('duplication.compare')}</h2>
            </div>

            {!selectedOverlap ? (
              <p className="text-sm text-gray-500">{t('duplication.selectOverlap')}</p>
            ) : (
              <ComparisonPanel overlap={selectedOverlap} canModify={canModify} onAction={handleAction} t={t} />
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function ComparisonPanel({
  overlap,
  canModify,
  onAction,
  t,
}: {
  overlap: EnrichedOverlap;
  canModify: boolean;
  onAction: (overlap: EnrichedOverlap, action: 'reviewed' | 'flagged') => void;
  t: (key: string) => string;
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-lg border border-gray-200 p-3.5 bg-gray-50">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-1">
            {t('duplication.draftClause')}
          </p>
          <p className="text-xs font-medium text-gray-700 mb-1">
            {overlap.draftBillTitle} · Art. {overlap.draftArticleNumber}
          </p>
          <p className="text-sm text-gray-800 leading-relaxed">{overlap.draftArticleText}</p>
        </div>
        <div className="rounded-lg border border-gray-200 p-3.5 bg-gray-50">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-1">
            {t('duplication.matchedClause')}
          </p>
          <p className="text-xs font-medium text-gray-700 mb-1">
            {overlap.matchedLawTitle} · Art. {overlap.matchedArticleNumber}
          </p>
          <p className="text-sm text-gray-800 leading-relaxed">{overlap.matchedArticleText}</p>
        </div>
      </div>

      <div className="rounded-lg bg-gray-50 border border-gray-200 p-3.5">
        <p className="text-xs text-gray-700 leading-relaxed">{overlap.summary}</p>
      </div>

      {canModify ? (
        <div className="flex gap-2">
          <button onClick={() => onAction(overlap, 'reviewed')} className="btn-secondary flex-1 flex items-center justify-center gap-2 text-sm">
            <CheckCircle2 className="w-4 h-4" />
            {t('duplication.markReviewed')}
          </button>
          <button onClick={() => onAction(overlap, 'flagged')} className="btn-primary flex-1 flex items-center justify-center gap-2 text-sm">
            <Flag className="w-4 h-4" />
            {t('duplication.flagForRevision')}
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg p-3">
          <Lock className="w-3.5 h-3.5" />
          {t('common.viewOnly')}
        </div>
      )}
      <p className="text-[11px] text-gray-400">{t('common.humanInLoop')}</p>
    </div>
  );
}
