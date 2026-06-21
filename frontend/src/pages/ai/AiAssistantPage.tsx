import { Button, Input, Spin } from 'antd';
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CalendarClock,
  ClipboardList,
  FileInput,
  Headset,
  MessageSquare,
  Package,
  RefreshCw,
  Send,
  ShoppingCart,
  Tag,
  TrendingUp,
  UserRound,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import * as React from 'react';
import { MarkdownMessage } from '@/components/ai/MarkdownMessage';
import { type Product } from '@/lib/itemMapper';
import { cn } from '@/lib/utils';
import { aiChat } from '@/services/wmsApi';
import type { PageKey } from '@/types/pages';

export type ChatMessage = {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  action?: { label: string; page: PageKey };
};

type PromptItem = {
  title: string;
  prompt: string;
  hint: string;
  icon: LucideIcon;
  tone: string;
};

const SUGGESTED_PROMPTS: PromptItem[] = [
  {
    title: 'Tồn kho',
    hint: 'SKU thấp / hết hàng',
    prompt: 'Sản phẩm nào sắp hết hàng hoặc đã hết hàng?',
    icon: Package,
    tone: 'bg-blue-50 text-blue-700 ring-blue-100',
  },
  {
    title: 'Doanh thu',
    hint: 'Xu hướng 7 ngày',
    prompt: 'Phân tích doanh thu và xu hướng bán 7 ngày gần nhất.',
    icon: TrendingUp,
    tone: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  },
  {
    title: 'Nhập hàng',
    hint: 'Đề xuất đặt hàng',
    prompt: 'Gợi ý SKU cần nhập hàng dựa trên tồn và dự báo.',
    icon: ShoppingCart,
    tone: 'bg-indigo-50 text-indigo-700 ring-indigo-100',
  },
  {
    title: 'Cận hạn',
    hint: 'Lô sắp HSD',
    prompt: 'Liệt kê lô hàng sắp hết hạn và đề xuất xử lý.',
    icon: CalendarClock,
    tone: 'bg-amber-50 text-amber-700 ring-amber-100',
  },
  {
    title: 'Cảnh báo',
    hint: 'Chưa xử lý',
    prompt: 'Tóm tắt các cảnh báo tồn kho chưa xử lý hôm nay.',
    icon: AlertTriangle,
    tone: 'bg-red-50 text-red-700 ring-red-100',
  },
  {
    title: 'Khuyến mãi',
    hint: 'SKU tồn cao',
    prompt: 'Đề xuất chương trình khuyến mãi cho SKU tồn cao.',
    icon: Tag,
    tone: 'bg-purple-50 text-purple-700 ring-purple-100',
  },
];

const QUICK_LINKS: Array<{ label: string; page: PageKey; icon: LucideIcon }> = [
  { label: 'Báo cáo doanh thu', page: 'reports', icon: BarChart3 },
  { label: 'Gợi ý nhập hàng', page: 'purchase-suggestions', icon: ClipboardList },
  { label: 'Tạo phiếu nhập', page: 'import-create', icon: FileInput },
];

let chatMsgSeq = 0;
function nextChatId() {
  chatMsgSeq += 1;
  return `chat-${Date.now()}-${chatMsgSeq}`;
}

function PromptCard({
  item,
  disabled,
  onSelect,
  compact = false,
}: {
  item: PromptItem;
  disabled: boolean;
  onSelect: (prompt: string) => void;
  compact?: boolean;
}) {
  const Icon = item.icon;
  return (
    <button
      type="button"
      disabled={disabled}
      className={cn(
        'group w-full rounded-xl border border-slate-200 bg-white text-left transition hover:border-slate-300 hover:shadow-sm disabled:opacity-60',
        compact ? 'px-3 py-3' : 'px-4 py-4'
      )}
      onClick={() => onSelect(item.prompt)}
    >
      <div className="flex items-start gap-3">
        <span className={cn('grid h-10 w-10 shrink-0 place-items-center rounded-lg ring-1', item.tone)}>
          <Icon size={18} strokeWidth={2.2} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center justify-between gap-2">
            <span className="text-sm font-semibold text-slate-800">{item.title}</span>
            <ArrowRight size={14} className="shrink-0 text-slate-300 transition group-hover:text-slate-500" />
          </span>
          <span className="mt-0.5 block text-xs text-slate-500">{item.hint}</span>
          {!compact && <span className="mt-2 line-clamp-2 text-xs leading-relaxed text-slate-400">{item.prompt}</span>}
        </span>
      </div>
    </button>
  );
}

export default function AiAssistantPage({
  productsList: _productsList,
  chatHistory,
  setChatHistory,
  setPage,
}: {
  productsList: Product[];
  chatHistory: ChatMessage[];
  setChatHistory: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  setPage: (page: PageKey) => void;
}) {
  const [typedMessage, setTypedMessage] = React.useState('');
  const [sending, setSending] = React.useState(false);
  const chatEndRef = React.useRef<HTMLDivElement>(null);
  const composingRef = React.useRef(false);
  const ignoreEnterUntilRef = React.useRef(0);
  const sendingRef = React.useRef(false);

  const userMessages = chatHistory.filter((m) => m.sender === 'user').length;
  const showWelcome = chatHistory.length <= 1;

  React.useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, sending]);

  const appendMessage = React.useCallback(
    (msg: Omit<ChatMessage, 'id'>) => {
      setChatHistory((prev) => [...prev, { ...msg, id: nextChatId() }]);
    },
    [setChatHistory]
  );

  const handleSendMessage = React.useCallback(
    async (rawText?: string) => {
      if (composingRef.current || sendingRef.current) return;

      const text = (rawText ?? typedMessage).trim();
      if (!text) return;

      sendingRef.current = true;
      setSending(true);
      setTypedMessage('');

      appendMessage({ sender: 'user', text });

      try {
        const aiText = await aiChat(text);
        const lower = text.toLowerCase();
        let action: { label: string; page: PageKey } | undefined;
        if (lower.includes('nhập') || lower.includes('tồn')) {
          action = { label: 'Tạo phiếu nhập', page: 'import-create' };
        } else if (lower.includes('báo cáo') || lower.includes('doanh thu')) {
          action = { label: 'Xem báo cáo', page: 'reports' };
        }
        appendMessage({ sender: 'ai', text: aiText, action });
      } catch {
        appendMessage({
          sender: 'ai',
          text: 'Không kết nối được trung tâm hỗ trợ vận hành. Vui lòng thử lại hoặc kiểm tra quyền ADMIN/MANAGER.',
        });
      } finally {
        sendingRef.current = false;
        setSending(false);
      }
    },
    [appendMessage, typedMessage]
  );

  const resetConversation = () => {
    setChatHistory([
      {
        id: nextChatId(),
        sender: 'ai',
        text: 'Xin chào! Tôi là bộ phận hỗ trợ vận hành SmartMart. Bạn muốn tra cứu tồn kho, phân tích doanh thu hay lên kế hoạch nhập hàng?',
      },
    ]);
    setTypedMessage('');
  };

  const trySubmitOnEnter = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== 'Enter' || e.shiftKey) return;

    if (
      composingRef.current ||
      e.nativeEvent.isComposing ||
      e.nativeEvent.keyCode === 229 ||
      Date.now() < ignoreEnterUntilRef.current
    ) {
      return;
    }

    e.preventDefault();
    void handleSendMessage();
  };

  return (
    <div className="flex min-h-[calc(100vh-7.5rem)] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.06)] lg:min-h-[calc(100vh-8.5rem)]">
      <section className="shrink-0 border-b border-slate-200 bg-slate-950 text-white">
        <div className="flex flex-wrap items-start justify-between gap-4 px-5 py-5 lg:px-6">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-bold ring-1 ring-white/15">
                <Headset size={14} /> Hỗ trợ vận hành
              </span>
              <span className="rounded-lg bg-emerald-400/15 px-3 py-1.5 text-xs font-bold text-emerald-100 ring-1 ring-emerald-300/20">
                Trực tuyến
              </span>
            </div>
            <h1 className="mt-3 text-2xl font-black tracking-tight sm:text-[28px]">Trung tâm hỗ trợ SmartMart</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
              Tra cứu tồn kho, doanh thu, cảnh báo và đề xuất nhập hàng — phản hồi dựa trên dữ liệu thực tế của hệ thống.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-lg bg-white/10 px-3 py-2 text-xs font-semibold text-slate-200 ring-1 ring-white/10">
              {userMessages} câu hỏi trong phiên
            </span>
            <Button
              icon={<RefreshCw size={14} />}
              className="!border-white/20 !bg-white/10 !text-white hover:!bg-white/20"
              onClick={resetConversation}
            >
              Phiên mới
            </Button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 border-t border-white/10 px-5 py-3 lg:px-6">
          {QUICK_LINKS.map((link) => {
            const Icon = link.icon;
            return (
              <button
                key={link.page}
                type="button"
                className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-xs font-semibold text-slate-100 transition hover:bg-white/15"
                onClick={() => setPage(link.page)}
              >
                <Icon size={14} />
                {link.label}
              </button>
            );
          })}
        </div>
      </section>

      <div className="flex min-h-0 flex-1 bg-slate-50/60">
        <main className="flex min-w-0 flex-1 flex-col">
          <div className="scrollbar-thin flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
            <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
              {showWelcome && (
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                  <div className="flex items-start gap-4">
                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-slate-900 text-white">
                      <MessageSquare size={22} />
                    </span>
                    <div>
                      <h2 className="text-lg font-bold text-slate-900 sm:text-xl">Bắt đầu cuộc trao đổi</h2>
                      <p className="mt-1 text-sm leading-6 text-slate-500">
                        Chọn chủ đề bên phải hoặc nhập câu hỏi trực tiếp. Hệ thống sẽ tổng hợp từ tồn kho, đơn hàng và cảnh báo hiện có.
                      </p>
                    </div>
                  </div>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:hidden">
                    {SUGGESTED_PROMPTS.slice(0, 4).map((item) => (
                      <PromptCard
                        key={item.title}
                        item={item}
                        disabled={sending}
                        compact
                        onSelect={(prompt) => void handleSendMessage(prompt)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {chatHistory.map((msg) => (
                <div
                  key={msg.id}
                  className={cn('flex gap-3', msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row')}
                >
                  <span
                    className={cn(
                      'grid h-9 w-9 shrink-0 place-items-center rounded-full ring-2 ring-white',
                      msg.sender === 'user' ? 'bg-slate-800 text-white' : 'bg-emerald-600 text-white'
                    )}
                  >
                    {msg.sender === 'user' ? <UserRound size={16} /> : <Headset size={16} />}
                  </span>
                  <div
                    className={cn(
                      'max-w-[min(100%,40rem)] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm sm:px-5 sm:py-4',
                      msg.sender === 'user'
                        ? 'bg-slate-900 text-white'
                        : 'border border-slate-200 bg-white text-slate-800'
                    )}
                  >
                    <div className={cn('mb-1 text-[11px] font-bold uppercase tracking-wide', msg.sender === 'user' ? 'text-slate-400' : 'text-slate-400')}>
                      {msg.sender === 'user' ? 'Bạn' : 'Hỗ trợ vận hành'}
                    </div>
                    {msg.sender === 'ai' ? (
                      <MarkdownMessage text={msg.text} />
                    ) : (
                      <span className="whitespace-pre-wrap break-words">{msg.text}</span>
                    )}
                    {msg.action && (
                      <Button
                        className="mt-3 h-8 border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700 hover:text-slate-900"
                        onClick={() => setPage(msg.action!.page)}
                      >
                        {msg.action.label}
                      </Button>
                    )}
                  </div>
                </div>
              ))}

              {sending && (
                <div className="flex items-center gap-3 px-1">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-emerald-600 text-white">
                    <Headset size={16} />
                  </span>
                  <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 shadow-sm">
                    <span className="inline-flex items-center gap-2">
                      <Spin size="small" /> Đang tổng hợp dữ liệu…
                    </span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
          </div>

          <div className="shrink-0 border-t border-slate-200 bg-white px-4 py-4 sm:px-6 lg:px-8">
            <div className="mx-auto flex w-full max-w-3xl items-end gap-3 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm focus-within:border-slate-400 focus-within:ring-2 focus-within:ring-slate-100">
              <Input.TextArea
                autoSize={{ minRows: 1, maxRows: 6 }}
                variant="borderless"
                placeholder="Nhập câu hỏi về tồn kho, doanh thu, nhập hàng…"
                value={typedMessage}
                disabled={sending}
                className="!bg-transparent !px-2 !py-2 text-[15px]"
                onChange={(e) => setTypedMessage(e.target.value)}
                onCompositionStart={() => {
                  composingRef.current = true;
                }}
                onCompositionEnd={() => {
                  composingRef.current = false;
                  ignoreEnterUntilRef.current = Date.now() + 120;
                }}
                onKeyDown={trySubmitOnEnter}
              />
              <Button
                type="primary"
                shape="circle"
                size="large"
                icon={<Send size={16} />}
                loading={sending}
                disabled={sending || !typedMessage.trim()}
                className="!bg-slate-900 hover:!bg-slate-800"
                onClick={() => void handleSendMessage()}
              />
            </div>
            <p className="mx-auto mt-2 max-w-3xl text-center text-xs text-slate-400">
              Nội dung phản hồi mang tính tham khảo — vui lòng đối chiếu báo cáo trước khi quyết định nhập hàng hoặc giảm giá.
            </p>
          </div>
        </main>

        <aside className="hidden w-[min(380px,34vw)] shrink-0 flex-col border-l border-slate-200 bg-white lg:flex">
          <div className="border-b border-slate-100 px-5 py-4">
            <h3 className="text-sm font-bold text-slate-800">Chủ đề gợi ý</h3>
            <p className="mt-1 text-xs text-slate-500">Nhấn để gửi câu hỏi mẫu vào khung chat.</p>
          </div>
          <div className="scrollbar-thin flex-1 space-y-2 overflow-y-auto p-4">
            {SUGGESTED_PROMPTS.map((item) => (
              <PromptCard
                key={item.title}
                item={item}
                disabled={sending}
                onSelect={(prompt) => void handleSendMessage(prompt)}
              />
            ))}
          </div>
          <div className="space-y-2 border-t border-slate-100 p-4">
            <div className="rounded-xl bg-slate-50 p-3">
              <div className="text-xs font-bold uppercase tracking-wide text-slate-500">Phím tắt</div>
              <ul className="mt-2 space-y-1 text-xs text-slate-600">
                <li><strong>Enter</strong> — Gửi tin nhắn</li>
                <li><strong>Shift + Enter</strong> — Xuống dòng</li>
              </ul>
            </div>
            <Button block className="h-10 font-semibold" onClick={() => setPage('purchase-suggestions')}>
              Mở gợi ý nhập hàng chi tiết
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}
