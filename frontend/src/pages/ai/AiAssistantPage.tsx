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
  Sparkles,
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
        'group w-full rounded-2xl border border-slate-200 bg-white text-left transition hover:border-emerald-200 hover:bg-emerald-50/40 disabled:opacity-60',
        compact ? 'px-3 py-2.5' : 'px-3.5 py-3'
      )}
      onClick={() => onSelect(item.prompt)}
    >
      <div className="flex items-start gap-3">
        <span className={cn('grid h-9 w-9 shrink-0 place-items-center rounded-xl ring-1', item.tone)}>
          <Icon size={18} strokeWidth={2.2} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center justify-between gap-2">
            <span className="text-sm font-semibold text-slate-800">{item.title}</span>
            <ArrowRight size={14} className="shrink-0 text-slate-300 transition group-hover:text-slate-500" />
          </span>
          <span className="mt-0.5 block text-xs text-slate-500">{item.hint}</span>
          {!compact && <span className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-slate-400">{item.prompt}</span>}
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

  const showWelcome = chatHistory.length <= 1;
  const visibleMessages = showWelcome ? chatHistory.filter((m) => m.sender === 'user') : chatHistory;

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
    <div className="grid h-[calc(100vh-7.5rem)] min-h-[680px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.06)] lg:grid-cols-[280px_1fr]">
      <aside className="hidden min-h-0 border-r border-slate-200 bg-slate-50/80 lg:flex lg:flex-col">
        <div className="border-b border-slate-200 p-3">
          <Button
            block
            icon={<MessageSquare size={16} />}
            className="h-11 justify-start rounded-xl border-slate-300 bg-white font-semibold text-slate-800 hover:!border-emerald-300 hover:!text-emerald-700"
            onClick={resetConversation}
          >
            Cuộc trò chuyện mới
          </Button>
        </div>

        <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto p-3">
          <div className="mb-2 px-2 text-xs font-bold uppercase tracking-wide text-slate-400">SmartAI gợi ý</div>
          <div className="space-y-2">
            {SUGGESTED_PROMPTS.map((item) => (
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

        <div className="border-t border-slate-200 p-3">
          <div className="mb-2 px-2 text-xs font-bold uppercase tracking-wide text-slate-400">Đi nhanh</div>
          <div className="space-y-1.5">
            {QUICK_LINKS.map((link) => {
              const Icon = link.icon;
              return (
                <button
                  key={link.page}
                  type="button"
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-semibold text-slate-600 transition hover:bg-white hover:text-slate-950"
                  onClick={() => setPage(link.page)}
                >
                  <Icon size={16} />
                  {link.label}
                </button>
              );
            })}
          </div>
        </div>
      </aside>

      <main className="flex min-h-0 min-w-0 flex-col bg-white">
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 sm:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-emerald-600 text-white shadow-sm">
              <Headset size={19} />
            </span>
            <div className="min-w-0">
              <h1 className="truncate text-base font-black text-slate-950 sm:text-lg">Trợ lý AI SmartMart</h1>
              <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-500">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Sẵn sàng hỗ trợ vận hành
              </div>
            </div>
          </div>
          <Button icon={<RefreshCw size={14} />} onClick={resetConversation}>
            Phiên mới
          </Button>
        </header>

        <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto bg-white px-4 py-6 sm:px-6">
          <div className="mx-auto flex w-full max-w-4xl flex-col">
            {showWelcome && (
              <section className="mx-auto mb-8 w-full max-w-3xl pt-4 text-center">
                <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-slate-950 text-white shadow-sm">
                  <Sparkles size={24} />
                </div>
                <h2 className="mt-5 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                  Hôm nay mình hỗ trợ gì cho cửa hàng?
                </h2>
                <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                  Hỏi về tồn kho, doanh thu, cảnh báo, nhập hàng hoặc khuyến mãi. SmartAI sẽ trả lời theo dữ liệu vận hành hiện có.
                </p>
                <div className="mt-6 grid gap-2 text-left sm:grid-cols-2 lg:hidden">
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
              </section>
            )}

            <div className="space-y-5">
              {visibleMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn('flex w-full gap-3', msg.sender === 'user' ? 'justify-end' : 'justify-start')}
                >
                  {msg.sender === 'ai' && (
                    <span className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-emerald-600 text-white">
                      <Headset size={15} />
                    </span>
                  )}
                  <div
                    className={cn(
                      'min-w-0 text-sm leading-7',
                      msg.sender === 'user'
                        ? 'max-w-[min(82%,44rem)] rounded-3xl bg-slate-100 px-4 py-2.5 text-slate-950'
                        : 'max-w-[min(100%,50rem)] text-slate-800'
                    )}
                  >
                    {msg.sender === 'ai' ? (
                      <div className="rounded-2xl px-1 py-1">
                        <MarkdownMessage text={msg.text} />
                        {msg.action && (
                          <Button
                            className="mt-3 h-9 rounded-xl border border-emerald-200 bg-emerald-50 text-xs font-semibold text-emerald-700 hover:!border-emerald-300 hover:!text-emerald-800"
                            onClick={() => setPage(msg.action!.page)}
                          >
                            {msg.action.label}
                          </Button>
                        )}
                      </div>
                    ) : (
                      <span className="whitespace-pre-wrap break-words">{msg.text}</span>
                    )}
                  </div>
                  {msg.sender === 'user' && (
                    <span className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-slate-900 text-white">
                      <UserRound size={15} />
                    </span>
                  )}
                </div>
              ))}

              {sending && (
                <div className="flex items-start gap-3">
                  <span className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-emerald-600 text-white">
                    <Headset size={15} />
                  </span>
                  <div className="inline-flex items-center gap-2 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-medium text-slate-500">
                    <Spin size="small" /> Đang phân tích dữ liệu cửa hàng…
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
          </div>
        </div>

        <footer className="shrink-0 bg-white px-4 pb-4 pt-2 sm:px-6">
          <div className="mx-auto w-full max-w-4xl">
            <div className="rounded-3xl border border-slate-200 bg-white p-2 shadow-[0_12px_35px_rgba(15,23,42,0.08)] focus-within:border-emerald-300 focus-within:ring-4 focus-within:ring-emerald-50">
              <Input.TextArea
                autoSize={{ minRows: 1, maxRows: 6 }}
                variant="borderless"
                placeholder="Nhắn cho SmartAI..."
                value={typedMessage}
                disabled={sending}
                className="!bg-transparent !px-3 !py-2 text-[15px]"
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
              <div className="flex items-center justify-between gap-2 px-2 pb-1">
                <div className="hidden flex-wrap gap-1.5 sm:flex">
                  {SUGGESTED_PROMPTS.slice(0, 3).map((item) => (
                    <button
                      key={item.title}
                      type="button"
                      disabled={sending}
                      onClick={() => void handleSendMessage(item.prompt)}
                      className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:bg-emerald-50 hover:text-emerald-700 disabled:opacity-60"
                    >
                      {item.title}
                    </button>
                  ))}
                </div>
                <Button
                  type="primary"
                  shape="circle"
                  size="large"
                  icon={<Send size={16} />}
                  loading={sending}
                  disabled={sending || !typedMessage.trim()}
                  className="ml-auto !bg-slate-900 hover:!bg-slate-800"
                  onClick={() => void handleSendMessage()}
                />
              </div>
            </div>
            <p className="mt-2 text-center text-xs text-slate-400">
              SmartAI có thể sai. Hãy đối chiếu báo cáo trước khi nhập hàng, xả hàng hoặc giảm giá.
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}
