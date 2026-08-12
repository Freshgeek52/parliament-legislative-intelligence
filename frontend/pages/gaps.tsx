import Head from 'next/head';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'react-hot-toast';
import { Check, X, MessageCircle, Lock, ScrollText } from 'lucide-react';
import AppShell from '../components/AppShell';
import SeverityBadge from '../components/SeverityBadge';
import { useLanguage } from '../lib/i18n';
import { api } from '../lib/api';
import { AnnotatedBill, Bill, GapIssue, GapStatus } from '../lib/types';
import { canModifySuggestions, getCurrentUser } from '../lib/auth';
import { cn } from '../lib/utils';

const GAP_BILL_IDS = ['bill-digital-governance', 'bill-ai-governance', 'bill-drafting-office'];

const SEVERITY_RING: Record<GapIssue['severity'], string> = {
  critical: 'ring-2 ring-red-300 bg-red-50/60 border-l-4 border-red-400',
  moderate: 'ring-2 ring-amber-300 bg-amber-50/60 border-l-4 border-amber-400',
  minor: 'ring-2 ring-blue-300 bg-blue-50/60 border-l-4 border-blue-400',
};

const STATUS_STYLES: Record<GapStatus, string> = {
  pending: 'bg-gray-50 text-gray-600 border-gray-200',
  accepted: 'bg-green-50 text-green-700 border-green-200',
  rejected: 'bg-gray-100 text-gray-500 border-gray-200 line-through',
};

export default function Gaps() {
  const { t } = useLanguage();
  const router = useRouter();
  const user = getCurrentUser();
  const canModify = user ? canModifySuggestions(user.role) : false;

  const [drafts, setDrafts] = useState<Bill[]>([]);
  const [selectedBillId, setSelectedBillId] = useState(GAP_BILL_IDS[0]);
  const [annotated, setAnnotated] = useState<AnnotatedBill | null>(null);
  const [issues, setIssues] = useState<GapIssue[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusOverrides, setStatusOverrides] = useState<Record<string, GapStatus>>({});
  const [openComment, setOpenComment] = useState<string | null>(null);
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [savedComments, setSavedComments] = useState<Record<string, string>>({});
  const [activeIssueId, setActiveIssueId] = useState<string | null>(null);

  const issueRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    api.listDrafts().then(setDrafts);
  }, []);

  useEffect(() => {
    const queryBill = router.query.bill;
    if (typeof queryBill === 'string' && GAP_BILL_IDS.includes(queryBill)) {
      setSelectedBillId(queryBill);
    }
  }, [router.query.bill]);

  // Run gap & intent analysis against the real corpus when the bill changes.
  useEffect(() => {
    setLoading(true);
    api.gaps(selectedBillId).then((res) => {
      setAnnotated(res.annotated);
      setIssues(res.issues);
      setLoading(false);
    });
  }, [selectedBillId]);

  const bill = drafts.find((b) => b.id === selectedBillId);

  const issueStatus = (issue: GapIssue): GapStatus => statusOverrides[issue.id] ?? issue.status;

  const logDecision = (issue: GapIssue, action: 'accepted' | 'rejected', details?: string) => {
    if (!user) return;
    api.postAudit({
      actorRole: user.role,
      module: 'Gap & Intent Alignment',
      action: action === 'accepted' ? 'Suggestion accepted' : 'Suggestion rejected',
      target: `${bill?.title} (${issue.articleRef})`,
      details,
    });
  };

  const handleDecision = (issue: GapIssue, next: GapStatus) => {
    setStatusOverrides((prev) => ({ ...prev, [issue.id]: next }));
    if (next === 'accepted' || next === 'rejected') {
      logDecision(issue, next);
      toast.success(next === 'accepted' ? t('common.accepted') : t('common.rejected'));
    }
  };

  const handleSaveComment = (issue: GapIssue) => {
    const text = (commentDrafts[issue.id] ?? '').trim();
    if (!text || !user) return;
    setSavedComments((prev) => ({ ...prev, [issue.id]: text }));
    setOpenComment(null);
    api.postAudit({
      actorRole: user.role,
      module: 'Gap & Intent Alignment',
      action: 'Comment added',
      target: `${bill?.title} (${issue.articleRef})`,
      details: `Comment: '${text}'`,
    });
    toast.success('Comment logged to audit trail');
  };

  const focusIssue = (issueId: string) => {
    setActiveIssueId(issueId);
    issueRefs.current[issueId]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <AppShell title={t('gaps.title')} subtitle={t('gaps.subtitle')}>
      <Head>
        <title>{t('gaps.title')} · {t('app.name')}</title>
      </Head>
      <div className="p-6 space-y-6">
        <div className="card flex flex-col sm:flex-row sm:items-center gap-3">
          <label className="text-sm font-medium text-gray-700 flex-shrink-0">{t('gaps.selectBillLabel')}</label>
          <select
            value={selectedBillId}
            onChange={(e) => {
              setSelectedBillId(e.target.value);
              setActiveIssueId(null);
            }}
            className="input-field sm:max-w-md"
          >
            {drafts.map((b) => (
              <option key={b.id} value={b.id}>
                {b.title}
              </option>
            ))}
          </select>
          {!canModify && (
            <div className="flex items-center gap-1.5 text-xs text-gray-500 sm:ml-auto">
              <Lock className="w-3.5 h-3.5" />
              {t('common.viewOnly')}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 card">
            <div className="flex items-center gap-2 mb-4">
              <ScrollText className="w-4 h-4 text-gray-500" />
              <h2 className="section-title">{t('gaps.billText')}</h2>
            </div>
            <div className="space-y-3">
              {annotated?.paragraphs.map((para) => {
                const paraIssues = issues.filter((i) => para.issueIds.includes(i.id));
                const highestSeverity = paraIssues[0]?.severity;
                return (
                  <div
                    key={para.id}
                    className={cn(
                      'rounded-md p-3 text-sm leading-relaxed text-gray-800 transition-colors',
                      highestSeverity ? SEVERITY_RING[highestSeverity] : 'bg-white'
                    )}
                  >
                    <p>{para.text}</p>
                    {paraIssues.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {paraIssues.map((issue) => (
                          <button
                            key={issue.id}
                            onClick={() => focusIssue(issue.id)}
                            className="inline-flex"
                          >
                            <SeverityBadge severity={issue.severity} />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-2 space-y-3">
            <h2 className="section-title px-1">
              {t('gaps.issues')}{' '}
              <span className="text-gray-400 font-normal">({loading ? '…' : issues.length})</span>
            </h2>
            {loading && <p className="text-sm text-gray-500 px-1">Analysing against laws in force…</p>}
            {issues.map((issue) => {
              const status = issueStatus(issue);
              return (
                <div
                  key={issue.id}
                  ref={(el) => {
                    issueRefs.current[issue.id] = el;
                  }}
                  className={cn(
                    'card transition-shadow',
                    activeIssueId === issue.id && 'ring-2 ring-primary-500'
                  )}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <SeverityBadge severity={issue.severity} />
                    <span className={cn('text-[11px] font-semibold px-2 py-0.5 rounded-full border', STATUS_STYLES[status])}>
                      {t(`common.${status}`)}
                    </span>
                  </div>
                  <p className="text-xs font-medium text-gray-500">
                    {issue.articleRef} · {issue.category}
                  </p>
                  <p className="text-sm font-semibold text-gray-900 mt-1">{issue.title}</p>
                  <p className="text-xs text-gray-600 mt-1.5 leading-relaxed">{issue.description}</p>
                  <div className="mt-2 rounded-md bg-amber-50 border border-amber-200 p-2.5">
                    <p className="text-[11px] font-semibold text-amber-800 uppercase tracking-wide mb-1">
                      {t('gaps.suggestedFix')}
                    </p>
                    <p className="text-xs text-gray-700 leading-relaxed">{issue.suggestedFix}</p>
                  </div>

                  {savedComments[issue.id] && (
                    <div className="mt-2 rounded-md bg-gray-50 p-2.5">
                      <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
                        {t('common.comment')}
                      </p>
                      <p className="text-xs text-gray-700">{savedComments[issue.id]}</p>
                    </div>
                  )}

                  {canModify ? (
                    <div className="mt-3 space-y-2">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDecision(issue, 'accepted')}
                          className={cn(
                            'flex-1 flex items-center justify-center gap-1.5 text-xs font-medium py-1.5 rounded-md border transition-colors',
                            status === 'accepted'
                              ? 'bg-green-600 text-white border-green-600'
                              : 'border-green-200 text-green-700 hover:bg-green-50'
                          )}
                        >
                          <Check className="w-3.5 h-3.5" />
                          {t('common.accept')}
                        </button>
                        <button
                          onClick={() => handleDecision(issue, 'rejected')}
                          className={cn(
                            'flex-1 flex items-center justify-center gap-1.5 text-xs font-medium py-1.5 rounded-md border transition-colors',
                            status === 'rejected'
                              ? 'bg-gray-700 text-white border-gray-700'
                              : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                          )}
                        >
                          <X className="w-3.5 h-3.5" />
                          {t('common.reject')}
                        </button>
                        <button
                          onClick={() => setOpenComment(openComment === issue.id ? null : issue.id)}
                          className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium py-1.5 rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          {t('common.comment')}
                        </button>
                      </div>
                      {openComment === issue.id && (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={commentDrafts[issue.id] ?? ''}
                            onChange={(e) => setCommentDrafts((prev) => ({ ...prev, [issue.id]: e.target.value }))}
                            placeholder={t('common.addComment')}
                            className="input-field text-xs"
                          />
                          <button onClick={() => handleSaveComment(issue)} className="btn-accent text-xs px-3">
                            {t('common.submit')}
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="mt-3 flex items-center gap-1.5 text-[11px] text-gray-400">
                      <Lock className="w-3 h-3" />
                      {t('common.viewOnly')}
                    </div>
                  )}
                </div>
              );
            })}
            <p className="text-[11px] text-gray-400 px-1">{t('common.humanInLoop')}</p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
