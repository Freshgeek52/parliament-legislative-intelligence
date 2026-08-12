import Head from 'next/head';
import { useEffect, useState } from 'react';
import { Sparkles, Globe2, AlertCircle } from 'lucide-react';
import AppShell from '../components/AppShell';
import { useLanguage } from '../lib/i18n';
import { api } from '../lib/api';
import { Bill, ComparativeTopic } from '../lib/types';

const COUNTRY_COLORS: Record<string, string> = {
  KE: 'bg-emerald-100 text-emerald-800',
  MU: 'bg-sky-100 text-sky-800',
  EE: 'bg-indigo-100 text-indigo-800',
  KR: 'bg-rose-100 text-rose-800',
};

type TopicOption = Pick<ComparativeTopic, 'id' | 'name' | 'relatedBillId' | 'description'>;

export default function Comparative() {
  const { t } = useLanguage();
  const [options, setOptions] = useState<TopicOption[]>([]);
  const [topicId, setTopicId] = useState('');
  const [topic, setTopic] = useState<ComparativeTopic | null>(null);
  const [relatedBill, setRelatedBill] = useState<Bill | null>(null);

  useEffect(() => {
    api.comparativeTopics().then((topics) => {
      setOptions(topics);
      if (topics[0]) setTopicId(topics[0].id);
    });
  }, []);

  useEffect(() => {
    if (!topicId) return;
    api.comparativeTopic(topicId).then(async (tp) => {
      setTopic(tp);
      setRelatedBill(tp?.relatedBillId ? await api.getBill(tp.relatedBillId) : null);
    });
  }, [topicId]);

  if (!topic) {
    return (
      <AppShell title={t('comparative.title')} subtitle={t('comparative.subtitle')}>
        <div className="p-6 text-sm text-gray-500">Loading comparative topics…</div>
      </AppShell>
    );
  }

  return (
    <AppShell title={t('comparative.title')} subtitle={t('comparative.subtitle')}>
      <Head>
        <title>{t('comparative.title')} · {t('app.name')}</title>
      </Head>
      <div className="p-6 space-y-6">
        <div className="card flex flex-col sm:flex-row sm:items-center gap-3">
          <label className="text-sm font-medium text-gray-700 flex-shrink-0">{t('comparative.topic')}</label>
          <select value={topicId} onChange={(e) => setTopicId(e.target.value)} className="input-field sm:max-w-md">
            {options.map((topicOption) => (
              <option key={topicOption.id} value={topicOption.id}>
                {topicOption.name}
              </option>
            ))}
          </select>
          {relatedBill && (
            <p className="text-xs text-gray-500 sm:ml-auto">
              {t('comparative.relatedBill')}: <span className="font-medium text-gray-700">{relatedBill.title}</span>
            </p>
          )}
        </div>

        <p className="text-sm text-gray-600">{topic.description}</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {topic.countries.map((c) => (
            <div key={c.country} className="card flex flex-col">
              <div className="flex items-center gap-3 mb-3">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold ${
                    COUNTRY_COLORS[c.countryCode] ?? 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {c.countryCode}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{c.country}</p>
                  <p className="text-[11px] text-gray-400 flex items-center gap-1">
                    <Globe2 className="w-3 h-3" /> Comparative reference
                  </p>
                </div>
              </div>
              <p className="text-xs font-medium text-gray-700 mb-1">{c.instrument}</p>
              <p className="text-xs text-gray-600 leading-relaxed flex-1">{c.provisionSummary}</p>
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-[11px] text-gray-500 leading-relaxed">{c.approachNote}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="card border-amber-200 bg-amber-50/60">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-amber-700" />
            <h2 className="section-title">{t('comparative.takeaway')}</h2>
          </div>
          <p className="text-sm text-gray-800 leading-relaxed">{topic.aiTakeaway}</p>
          <div className="mt-3 flex items-start gap-1.5 text-[11px] text-gray-500">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            {t('comparative.takeawayNote')}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
