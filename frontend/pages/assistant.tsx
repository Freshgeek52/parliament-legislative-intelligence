import Head from 'next/head';
import { useEffect, useRef, useState } from 'react';
import {
  Send, FileText, Scroll, MessageSquareText, Landmark, CheckSquare, Square,
  Sparkles, Pencil, Check, X, RefreshCw, Copy,
} from 'lucide-react';
import AppShell from '../components/AppShell';
import CitationChip from '../components/CitationChip';
import { useLanguage } from '../lib/i18n';
import { api } from '../lib/api';
import { ChatMessage, KBCollection } from '../lib/types';
import { cn } from '../lib/utils';

// Starter prompts shown as chips. These reference real draft bills and real
// laws in force, so every one produces a grounded, cited answer.
const suggestedPrompts = [
  'What are the obligations when there is a personal data breach?',
  'How does the law govern electronic transactions and signatures?',
  'What does the law say about cyber security?',
  'Summarise the purpose and scope of the digital governance bill',
];

const COLLECTION_ICONS: Record<string, typeof FileText> = {
  'kb-laws': Scroll,
  'kb-bills': FileText,
  'kb-hansard': MessageSquareText,
  'kb-committee-reports': Landmark,
};

export default function Assistant() {
  const { lang, t } = useLanguage();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [knowledgeBase, setKnowledgeBase] = useState<KBCollection[]>([]);
  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(() => new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load the real knowledge base (laws in force + drafts) from the backend.
  // Default scope is EMPTY, which the backend treats as "search every law in
  // force" - the right default so a general legal question finds the relevant
  // law. Ticking documents narrows retrieval to just those.
  useEffect(() => {
    api.knowledgeBase().then(setKnowledgeBase);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isTyping]);

  const toggleDoc = (docId: string) => {
    setSelectedDocs((prev) => {
      const next = new Set(prev);
      if (next.has(docId)) next.delete(docId);
      else next.add(docId);
      return next;
    });
  };

  // Retrieval is scoped to the laws whose KB documents are ticked (refId
  // carries the backend law/bill id). Empty selection = search everything.
  const scopedLawIds = () =>
    knowledgeBase
      .flatMap((c) => c.documents)
      .filter((d) => selectedDocs.has(d.id) && d.refId)
      .map((d) => d.refId as string);

  // Shared grounded call: ask the backend, which retrieves + cites real law.
  const fetchAnswer = async (text: string): Promise<ChatMessage> => {
    const lawIds = scopedLawIds();
    return api.chat(text, lang, lawIds.length ? lawIds : undefined);
  };

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const userMessage: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      text: trimmed,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);
    const assistantMessage = await fetchAnswer(trimmed);
    setMessages((prev) => [...prev, assistantMessage]);
    setIsTyping(false);
  };

  const startEdit = (message: ChatMessage) => {
    setEditingId(message.id);
    setEditingText(message.text);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingText('');
  };

  // Edit a past question: keep the conversation up to that message, replace its
  // text, discard everything after it (the now-stale answer and later turns),
  // and regenerate a fresh grounded answer.
  const saveEdit = async (messageId: string) => {
    const trimmed = editingText.trim();
    if (!trimmed) return;
    const idx = messages.findIndex((m) => m.id === messageId);
    if (idx === -1) return;

    const edited: ChatMessage = { ...messages[idx], text: trimmed, timestamp: new Date().toISOString() };
    setMessages([...messages.slice(0, idx), edited]);
    setEditingId(null);
    setEditingText('');
    setIsTyping(true);
    const assistantMessage = await fetchAnswer(trimmed);
    setMessages((prev) => [...prev, assistantMessage]);
    setIsTyping(false);
  };

  // Regenerate an assistant answer from the question that preceded it.
  const regenerate = async (assistantId: string) => {
    const idx = messages.findIndex((m) => m.id === assistantId);
    if (idx <= 0) return;
    const prompt = messages[idx - 1];
    if (prompt.role !== 'user') return;
    setMessages(messages.slice(0, idx));
    setIsTyping(true);
    const assistantMessage = await fetchAnswer(prompt.text);
    setMessages((prev) => [...prev, assistantMessage]);
    setIsTyping(false);
  };

  const copyText = async (message: ChatMessage) => {
    try {
      await navigator.clipboard.writeText(message.text);
      setCopiedId(message.id);
      window.setTimeout(() => setCopiedId((id) => (id === message.id ? null : id)), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <AppShell title={t('assistant.title')} subtitle={t('assistant.subtitle')}>
      <Head>
        <title>{t('assistant.title')} · {t('app.name')}</title>
      </Head>
      <div className="h-full flex flex-col lg:flex-row">
        {/* Knowledge base sidebar */}
        <aside className="lg:w-80 flex-shrink-0 border-b lg:border-b-0 lg:border-r border-gray-200 bg-white overflow-y-auto scrollbar-thin max-h-64 lg:max-h-none">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-sm font-semibold text-gray-900">{t('assistant.knowledgeBase')}</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {selectedDocs.size === 0
                ? 'Searching all laws in force'
                : `Scoped to ${selectedDocs.size} ${t('assistant.documentsSelected')}`}
            </p>
            {selectedDocs.size > 0 && (
              <button
                onClick={() => setSelectedDocs(new Set())}
                className="mt-1 text-[11px] text-primary-600 hover:text-primary-800"
              >
                Clear selection (search all)
              </button>
            )}
          </div>
          <div className="p-3 space-y-4">
            {knowledgeBase.map((collection) => {
              const Icon = COLLECTION_ICONS[collection.id] ?? FileText;
              return (
                <div key={collection.id}>
                  <div className="flex items-center gap-2 px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    <Icon className="w-3.5 h-3.5" />
                    {collection.name}
                  </div>
                  <div className="space-y-0.5 mt-1">
                    {collection.documents.map((doc) => {
                      const checked = selectedDocs.has(doc.id);
                      const titleOnly = doc.hasFullText === false;
                      return (
                        <button
                          key={doc.id}
                          onClick={() => toggleDoc(doc.id)}
                          title={titleOnly
                            ? 'Metadata only: this law can be found by title, but its full text is not indexed, so the assistant cannot quote its articles.'
                            : 'Full text indexed: the assistant can quote specific articles from this law.'}
                          className="w-full flex items-start gap-2 px-2 py-1.5 rounded-md hover:bg-gray-50 text-left"
                        >
                          {checked ? (
                            <CheckSquare className="w-4 h-4 text-primary-600 flex-shrink-0 mt-0.5" />
                          ) : (
                            <Square className="w-4 h-4 text-gray-300 flex-shrink-0 mt-0.5" />
                          )}
                          <span className="min-w-0 flex-1">
                            <span className="block text-xs text-gray-700 leading-snug">{doc.title}</span>
                            <span
                              className={cn(
                                'mt-0.5 inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium',
                                titleOnly
                                  ? 'bg-gray-100 text-gray-500'
                                  : 'bg-green-50 text-green-700'
                              )}
                            >
                              {titleOnly ? (
                                <>
                                  <FileText className="w-2.5 h-2.5" /> Title only
                                </>
                              ) : (
                                <>
                                  <CheckSquare className="w-2.5 h-2.5" /> Full text
                                </>
                              )}
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </aside>

        {/* Chat pane */}
        <div className="flex-1 flex flex-col min-w-0">
          <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin p-6 space-y-4">
            {messages.length === 0 && !isTyping && (
              <div className="h-full flex flex-col items-center justify-center text-center text-gray-500 px-6">
                <Sparkles className="w-8 h-8 text-primary-400 mb-3" />
                <p className="text-sm max-w-md leading-relaxed">
                  Ask about any Rwandan law in force. Answers are grounded in the real
                  legislation, sourced from amategeko.gov.rw, and cite the specific law and article.
                </p>
                <p className="text-xs text-gray-400 mt-2">Try one of the prompts below, or type your own question.</p>
              </div>
            )}
            {messages.map((message, i) => {
              const isUser = message.role === 'user';
              const isEditing = editingId === message.id;
              const isLastAssistant = !isUser && i === messages.length - 1;
              return (
                <div key={message.id} className={cn('group flex flex-col', isUser ? 'items-end' : 'items-start')}>
                  <div
                    className={cn(
                      'max-w-2xl rounded-2xl px-4 py-3 shadow-sm',
                      isUser ? 'bg-primary-600 text-white rounded-br-sm' : 'bg-white border border-gray-200 rounded-bl-sm',
                      isEditing && 'w-full'
                    )}
                  >
                    {isEditing ? (
                      <div className="flex flex-col gap-2">
                        <textarea
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              saveEdit(message.id);
                            }
                            if (e.key === 'Escape') cancelEdit();
                          }}
                          rows={2}
                          autoFocus
                          className="w-full resize-none rounded-md bg-white/95 text-gray-900 text-sm p-2 outline-none"
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={cancelEdit}
                            className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-md bg-white/20 hover:bg-white/30"
                          >
                            <X className="w-3.5 h-3.5" /> {t('common.cancel') || 'Cancel'}
                          </button>
                          <button
                            onClick={() => saveEdit(message.id)}
                            className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-md bg-white text-primary-700 font-medium hover:bg-gray-50"
                          >
                            <Check className="w-3.5 h-3.5" /> Save &amp; resend
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className={cn('text-sm leading-relaxed whitespace-pre-line', isUser ? 'text-white' : 'text-gray-800')}>
                          {message.text}
                        </p>
                        {message.citations && message.citations.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-100">
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-1.5">
                              {t('assistant.sources')}
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {message.citations.map((c, idx) => (
                                <CitationChip key={`${message.id}-${idx}`} citation={c} />
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Hover actions */}
                  {!isEditing && (
                    <div
                      className={cn(
                        'flex items-center gap-3 mt-1 px-1 text-[11px] text-gray-400',
                        'opacity-0 group-hover:opacity-100 transition-opacity',
                        isUser ? 'justify-end' : 'justify-start'
                      )}
                    >
                      {isUser && !isTyping && (
                        <button onClick={() => startEdit(message)} className="inline-flex items-center gap-1 hover:text-gray-700">
                          <Pencil className="w-3 h-3" /> Edit
                        </button>
                      )}
                      {isLastAssistant && !isTyping && (
                        <button onClick={() => regenerate(message.id)} className="inline-flex items-center gap-1 hover:text-gray-700">
                          <RefreshCw className="w-3 h-3" /> Regenerate
                        </button>
                      )}
                      {!isUser && (
                        <button onClick={() => copyText(message)} className="inline-flex items-center gap-1 hover:text-gray-700">
                          <Copy className="w-3 h-3" /> {copiedId === message.id ? 'Copied' : 'Copy'}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-primary-600" />
                    <span className="text-xs text-gray-500">{t('common.loading')}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-gray-200 bg-white p-4">
            <div className="flex flex-wrap gap-2 mb-3">
              {suggestedPrompts.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => sendMessage(prompt)}
                  className="text-xs px-3 py-1.5 rounded-full border border-gray-200 text-gray-600 hover:border-primary-400 hover:text-gray-900 transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage(input);
              }}
              className="flex items-end gap-2"
            >
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage(input);
                  }
                }}
                placeholder={t('assistant.inputPlaceholder')}
                rows={2}
                className="input-field resize-none"
              />
              <button type="submit" className="btn-accent flex items-center gap-2 h-fit">
                <Send className="w-4 h-4" />
                <span className="hidden sm:inline">{t('common.send')}</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
