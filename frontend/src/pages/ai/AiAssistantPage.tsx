import { Button, Input, Spin } from 'antd';
import { SendOutlined, RobotOutlined } from '@ant-design/icons';
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

const SUGGESTED_PROMPTS = [
  {
    title: 'Tồn kho',
    prompt: 'Sản phẩm nào sắp hết hàng hoặc đã hết hàng?',
    icon: '📦',
  },
  {
    title: 'Doanh thu',
    prompt: 'Phân tích doanh thu và xu hướng bán 7 ngày gần nhất.',
    icon: '📈',
  },
  {
    title: 'Nhập hàng',
    prompt: 'Gợi ý SKU cần nhập hàng dựa trên tồn và dự báo.',
    icon: '🛒',
  },
  {
    title: 'Cận hạn',
    prompt: 'Liệt kê lô hàng sắp hết hạn và đề xuất xử lý.',
    icon: '⏳',
  },
  {
    title: 'Cảnh báo',
    prompt: 'Tóm tắt các cảnh báo tồn kho chưa xử lý hôm nay.',
    icon: '⚠️',
  },
  {
    title: 'Khuyến mãi',
    prompt: 'Đề xuất chương trình khuyến mãi cho SKU tồn cao.',
    icon: '🏷️',
  },
] as const;

let chatMsgSeq = 0;
function nextChatId() {
  chatMsgSeq += 1;
  return `chat-${Date.now()}-${chatMsgSeq}`;
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
          text: 'Không kết nối được trợ lý AI. Vui lòng thử lại hoặc kiểm tra quyền ADMIN/MANAGER.',
        });
      } finally {
        sendingRef.current = false;
        setSending(false);
      }
    },
    [appendMessage, typedMessage]
  );

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
      <header className="flex shrink-0 items-center justify-between border-b border-slate-100 px-5 py-4">
        <div>
          <div className="flex items-center gap-2 text-lg font-bold text-slate-900">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-600 text-white">
              <RobotOutlined />
            </span>
            Trợ lý vận hành SmartMart
          </div>
          <p className="mt-1 text-sm text-slate-500">Hỏi về tồn kho, nhập hàng, doanh thu và cảnh báo — Enter để gửi, Shift+Enter xuống dòng.</p>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <main className="flex min-w-0 flex-1 flex-col">
          <div className="scrollbar-thin flex-1 overflow-y-auto px-4 py-6 sm:px-8">
            <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
              {showWelcome && (
                <div className="py-6 text-center">
                  <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">Bạn cần hỗ trợ gì hôm nay?</h2>
                  <p className="mx-auto mt-2 max-w-xl text-sm text-slate-500">
                    Chọn gợi ý bên phải hoặc nhập câu hỏi — trợ lý sẽ phân tích dữ liệu vận hành thực tế của cửa hàng.
                  </p>
                  <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:hidden">
                    {SUGGESTED_PROMPTS.slice(0, 4).map((item) => (
                      <button
                        key={item.title}
                        type="button"
                        disabled={sending}
                        className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-left transition hover:border-emerald-200 hover:bg-emerald-50/60 disabled:opacity-60"
                        onClick={() => void handleSendMessage(item.prompt)}
                      >
                        <span className="text-lg">{item.icon}</span>
                        <div className="mt-2 text-sm font-semibold text-slate-800">{item.title}</div>
                        <div className="mt-1 line-clamp-2 text-xs text-slate-500">{item.prompt}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {chatHistory.map((msg) => (
                <div
                  key={msg.id}
                  className={cn('flex w-full', msg.sender === 'user' ? 'justify-end' : 'justify-start')}
                >
                  <div
                    className={cn(
                      'max-w-[min(100%,42rem)] rounded-2xl px-4 py-3 text-sm leading-relaxed sm:px-5 sm:py-4',
                      msg.sender === 'user'
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'border border-slate-200 bg-slate-50 text-slate-800'
                    )}
                  >
                    {msg.sender === 'ai' ? (
                      <MarkdownMessage text={msg.text} />
                    ) : (
                      <span className="whitespace-pre-wrap break-words">{msg.text}</span>
                    )}
                    {msg.action && (
                      <Button
                        className="mt-3 h-8 border border-emerald-200 bg-white text-xs font-semibold text-emerald-700 hover:text-emerald-800"
                        onClick={() => setPage(msg.action!.page)}
                      >
                        {msg.action.label}
                      </Button>
                    )}
                  </div>
                </div>
              ))}

              {sending && (
                <div className="flex items-center gap-2 px-1 text-sm text-slate-500">
                  <Spin size="small" /> Đang trả lời…
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
          </div>

          <div className="shrink-0 border-t border-slate-100 bg-white px-4 py-4 sm:px-8">
            <div className="mx-auto flex w-full max-w-3xl items-end gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-2 shadow-sm focus-within:border-emerald-300 focus-within:ring-2 focus-within:ring-emerald-100">
              <Input.TextArea
                autoSize={{ minRows: 1, maxRows: 6 }}
                variant="borderless"
                placeholder="Nhập câu hỏi cho trợ lý AI…"
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
                icon={<SendOutlined />}
                loading={sending}
                disabled={sending || !typedMessage.trim()}
                className="!bg-emerald-600 hover:!bg-emerald-700"
                onClick={() => void handleSendMessage()}
              />
            </div>
            <p className="mx-auto mt-2 max-w-3xl text-center text-xs text-slate-400">
              Trợ lý AI có thể mắc lỗi — hãy kiểm tra lại trước khi quyết định nhập hàng hoặc giảm giá.
            </p>
          </div>
        </main>

        <aside className="hidden w-[min(360px,32vw)] shrink-0 flex-col border-l border-slate-100 bg-slate-50/70 lg:flex">
          <div className="border-b border-slate-100 px-5 py-4">
            <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">Gợi ý câu hỏi</h3>
            <p className="mt-1 text-xs text-slate-500">Nhấn để gửi nhanh — giống prompt mẫu trên ChatGPT.</p>
          </div>
          <div className="scrollbar-thin flex-1 space-y-2 overflow-y-auto p-4">
            {SUGGESTED_PROMPTS.map((item) => (
              <button
                key={item.title}
                type="button"
                disabled={sending}
                className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-left transition hover:border-emerald-200 hover:bg-emerald-50/50 disabled:opacity-60"
                onClick={() => void handleSendMessage(item.prompt)}
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">{item.icon}</span>
                  <span className="text-sm font-semibold text-slate-800">{item.title}</span>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-500">{item.prompt}</p>
              </button>
            ))}
          </div>
          <div className="border-t border-slate-100 p-4">
            <Button block className="h-10 font-semibold" onClick={() => setPage('purchase-suggestions')}>
              Mở gợi ý nhập hàng chi tiết
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}
