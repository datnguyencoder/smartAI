import * as React from 'react';

// Markdown renderer nhẹ cho khung chat AI (headings, bảng, code block, hr, danh sách, in đậm,
// gạch ngang, link) — không dùng thư viện ngoài. Duyệt theo BLOCK (không phải từng dòng riêng
// lẻ) vì bảng và code block cần gộp nhiều dòng liên tiếp lại thành 1 phần tử.
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

    // Fenced code block ```...``` — trước đây không xử lý nên AI trả code/JSON mẫu bị hiện
    // nguyên 3 dấu backtick ra màn hình thay vì khối code có nền riêng.
    if (trimmed.startsWith('```')) {
      const lang = trimmed.slice(3).trim();
      const codeLines: string[] = [];
      i += 1;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i += 1;
      }
      i += 1; // bỏ qua dòng ``` đóng
      blocks.push(
        <pre key={key++} className="overflow-x-auto rounded-lg bg-slate-900 px-3.5 py-3 text-[13px] leading-6 text-slate-100">
          {lang && <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">{lang}</div>}
          <code>{codeLines.join('\n')}</code>
        </pre>
      );
      continue;
    }

    // Bảng Markdown "| a | b |" + dòng phân cách "| --- | --- |" ngay dưới.
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

    // Dòng kẻ ngang "---" / "***" / "___" dùng để ngăn cách các phần — trước đây hiện nguyên
    // ký tự gạch ra vì không khớp bất kỳ pattern nào, rơi xuống đoạn văn thường.
    if (/^([-*_])\1{2,}$/.test(trimmed)) {
      blocks.push(<hr key={key++} className="my-2 border-slate-200" />);
      i += 1;
      continue;
    }

    const heading = trimmed.match(/^(#{1,4})\s+(.+)$/);
    if (heading) {
      const level = heading[1].length;
      const content = heading[2];
      const headingClass =
        level === 1
          ? 'mt-4 text-lg font-black text-slate-950'
          : level === 2
            ? 'mt-4 text-base font-bold text-slate-950'
            : 'mt-3 text-sm font-bold text-slate-900';
      const Tag = level === 1 ? 'h2' : level === 2 ? 'h3' : 'h4';
      blocks.push(React.createElement(Tag, { key: key++, className: headingClass }, content));
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
    const numbered = trimmed.match(/^(\d+)[.)]\s+(.+)$/);
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

// Thứ tự các pattern quan trọng: link phải tách trước bold/code để "[**a**](url)" không bị
// formatInline con xử lý lệch; strikethrough ~~..~~ tách trước để không đụng dấu * của bold.
const INLINE_PATTERN = /(\[[^\]]+\]\([^)]+\)|\*\*[^*]+\*\*|~~[^~]+~~|`[^`]+`)/g;

function formatInline(text: string): React.ReactNode {
  const parts = text.split(INLINE_PATTERN);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('~~') && part.endsWith('~~')) {
      return <span key={i} className="text-slate-400 line-through">{part.slice(2, -2)}</span>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={i} className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[0.92em] font-semibold text-slate-700">{part.slice(1, -1)}</code>;
    }
    const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (link) {
      return (
        <a key={i} href={link[2]} target="_blank" rel="noreferrer" className="text-emerald-700 underline underline-offset-2">
          {link[1]}
        </a>
      );
    }
    return <span key={i}>{part}</span>;
  });
}
