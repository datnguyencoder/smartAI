import * as React from 'react';

// Lightweight Markdown renderer (headings, bold, lists) — no extra dependency
export function MarkdownMessage({ text }: { text: string }) {
  const lines = text.split('\n');
  return (
    <div className="max-w-none space-y-2 text-[15px] leading-7 text-slate-800">
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={i} className="h-1" />;
        if (trimmed.startsWith('## ')) {
          return <h3 key={i} className="mt-4 text-base font-bold text-slate-950">{trimmed.slice(3)}</h3>;
        }
        if (trimmed.startsWith('# ')) {
          return <h2 key={i} className="mt-4 text-lg font-black text-slate-950">{trimmed.slice(2)}</h2>;
        }
        if (trimmed.startsWith('- ')) {
          return <div key={i} className="flex gap-2 pl-1"><span className="mt-[0.7em] h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" /><span>{formatInline(trimmed.slice(2))}</span></div>;
        }
        return <p key={i} className="m-0">{formatInline(trimmed)}</p>;
      })}
    </div>
  );
}

function formatInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
}
