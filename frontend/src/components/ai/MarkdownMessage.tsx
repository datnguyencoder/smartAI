import * as React from 'react';

// Lightweight Markdown renderer (headings, bold, lists, bảng) — không dùng thư viện ngoài.
// Duyệt theo BLOCK (không phải từng dòng riêng lẻ) vì bảng Markdown cần gộp nhiều dòng liên
// tiếp lại — trước đây mỗi dòng "| a | b |" bị render như 1 đoạn văn riêng, hiện nguyên ký tự
// "|" và dòng phân cách "---" ra màn hình thay vì thành bảng, dữ liệu doanh thu/top SP AI hay
// trả về dạng bảng nhìn rất lỗi.
export function MarkdownMessage({ text }: { text: string }) {
  const lines = text.split('\n');
  const blocks: React.ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      blocks.push(<div key={key++} className="h-1" />);
      i += 1;
      continue;
    }

    if (isTableRow(trimmed) && i + 1 < lines.length && isTableSeparator(lines[i + 1].trim())) {
      const headerCells = splitTableRow(trimmed);
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && isTableRow(lines[i].trim())) {
        rows.push(splitTableRow(lines[i].trim()));
        i += 1;
      }
      blocks.push(<MarkdownTable key={key++} headers={headerCells} rows={rows} />);
      continue;
    }

    if (trimmed.startsWith('## ')) {
      blocks.push(<h3 key={key++} className="mt-4 text-base font-bold text-slate-950">{trimmed.slice(3)}</h3>);
      i += 1;
      continue;
    }
    if (trimmed.startsWith('# ')) {
      blocks.push(<h2 key={key++} className="mt-4 text-lg font-black text-slate-950">{trimmed.slice(2)}</h2>);
      i += 1;
      continue;
    }
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      blocks.push(
        <div key={key++} className="flex gap-2 pl-1">
          <span className="mt-[0.7em] h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
          <span>{formatInline(trimmed.slice(2))}</span>
        </div>
      );
      i += 1;
      continue;
    }
    const numbered = trimmed.match(/^(\d+)\.\s+(.+)$/);
    if (numbered) {
      blocks.push(
        <div key={key++} className="flex gap-2 pl-1">
          <span className="min-w-5 shrink-0 font-bold text-emerald-700">{numbered[1]}.</span>
          <span>{formatInline(numbered[2])}</span>
        </div>
      );
      i += 1;
      continue;
    }
    blocks.push(<p key={key++} className="m-0">{formatInline(trimmed)}</p>);
    i += 1;
  }

  return <div className="max-w-none space-y-2 text-[15px] leading-7 text-slate-800">{blocks}</div>;
}

function isTableRow(line: string): boolean {
  return line.startsWith('|') && line.endsWith('|') && line.length > 1;
}

function isTableSeparator(line: string): boolean {
  if (!isTableRow(line)) return false;
  return splitTableRow(line).every((cell) => /^:?-{2,}:?$/.test(cell.trim()));
}

function splitTableRow(line: string): string[] {
  return line
    .slice(1, -1)
    .split('|')
    .map((cell) => cell.trim());
}

function MarkdownTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="my-2 overflow-x-auto rounded-lg border border-slate-200">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-slate-50">
            {headers.map((h, i) => (
              <th key={i} className="border-b border-slate-200 px-3 py-2 text-left font-bold text-slate-700">
                {formatInline(h)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} className={ri % 2 === 1 ? 'bg-slate-50/60' : undefined}>
              {row.map((cell, ci) => (
                <td key={ci} className="border-b border-slate-100 px-3 py-2 text-slate-700">
                  {formatInline(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function formatInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={i} className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[0.92em] font-semibold text-slate-700">{part.slice(1, -1)}</code>;
    }
    return <span key={i}>{part}</span>;
  });
}
