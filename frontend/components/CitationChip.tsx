import { useState } from 'react';
import { BookText, ChevronDown, ChevronUp } from 'lucide-react';
import { Citation } from '../lib/types';

interface CitationChipProps {
  citation: Citation;
}

// Renders a clickable "[Law title · Art. N]" chip. Clicking it expands an
// inline excerpt panel so every AI answer's sources are directly
// inspectable, not just named.
export default function CitationChip({ citation }: CitationChipProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="inline-flex flex-col align-top">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-gray-200 bg-gray-50 text-gray-700 text-xs font-medium hover:bg-gray-100 transition-colors"
      >
        <BookText className="w-3 h-3" />
        <span className="max-w-[220px] truncate">{citation.billTitle}</span>
        <span className="text-gray-400">·</span>
        <span>Art. {citation.articleNumber}</span>
        {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>
      {open && (
        <div className="mt-1.5 max-w-md rounded-md border border-gray-200 bg-white p-2.5 text-xs text-gray-700 shadow-sm animate-fade-in">
          <p className="font-semibold text-gray-800 mb-1">
            {citation.billTitle} · Article {citation.articleNumber}
          </p>
          <p className="italic text-gray-600">&ldquo;{citation.excerpt}&rdquo;</p>
        </div>
      )}
    </div>
  );
}
