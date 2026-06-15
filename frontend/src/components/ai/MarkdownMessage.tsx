import * as React from 'react';

// Lightweight Markdown renderer (headings, bold, lists) — no extra dependency
export function MarkdownMessage({ text }: { text: string }) {
  const lines = text.split('\n');
  return (
    <div className="space-y-1 prose-sm max-w-none">
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return <br key={i} />;
        if (trimmed.startsWith('## ')) {
          return <h3 key={i} className="font-bold text-base mt-2">{trimmed.slice(3)}</h3>;
        }
        if (trimmed.startsWith('# ')) {
          return <h2 key={i} className="font-bold text-lg mt-2">{trimmed.slice(2)}</h2>;
        }
        if (trimmed.startsWith('- ')) {
          return <li key={i} className="ml-4 list-disc">{formatInline(trimmed.slice(2))}</li>;
        }
        return <p key={i}>{formatInline(trimmed)}</p>;
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
