import { Button, Input, Spin } from 'antd';
import { SendOutlined } from '@ant-design/icons';
import * as React from 'react';
import { MarkdownMessage } from '@/components/ai/MarkdownMessage';
import { Card, CardHeader } from '@/components/ui';
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

  React.useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, sending]);

  const appendMessage = React.useCallback(
    (msg: Omit<ChatMessage, 'id'>) => {
      setChatHistory((prev) => [...prev, { ...msg, id: nextChatId() }]);
    },
    [setChatHistory]
  );

  const handleSendMessage = React.useCallback(async () => {
    if (composingRef.current || sendingRef.current) return;

    const text = typedMessage.trim();
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
  }, [appendMessage, typedMessage]);

  const trySubmitOnEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter' || e.shiftKey) return;

    // IME tiếng Việt: Enter xác nhận từ → không gửi chat
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
    <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
      <Card className="flex min-h-[580px] flex-col justify-between">
        <CardHeader
          title="Trợ lý vận hành"
          description="Hỏi đáp về tồn kho, nhập hàng và doanh thu. Nhấn Enter để gửi."
        />
        <div className="scrollbar-thin max-h-[380px] flex-1 space-y-4 overflow-y-auto px-5 pb-5">
          {chatHistory.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                'relative flex max-w-[80%] flex-col rounded-2xl p-4 text-sm',
                msg.sender === 'user'
                  ? 'ml-auto bg-primary text-white shadow-md'
                  : 'border border-slate-200 bg-slate-100 text-slate-800 shadow-sm'
              )}
            >
              {msg.sender === 'ai' ? <MarkdownMessage text={msg.text} /> : <span className="whitespace-pre-wrap break-words">{msg.text}</span>}
              {msg.action && (
                <Button
                  className="mt-3 h-8 border border-indigo/20 bg-white text-xs font-semibold text-indigo hover:text-indigo-700"
                  onClick={() => setPage(msg.action!.page)}
                >
                  {msg.action.label}
                </Button>
              )}
            </div>
          ))}
          {sending && (
            <div className="flex items-center gap-2 text-sm text-muted">
              <Spin size="small" /> Đang trả lời…
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
        <div className="flex gap-2 rounded-b-2xl border-t border-slate-100 bg-slate-50/50 p-4">
          <Input
            size="large"
            placeholder="Ví dụ: Sản phẩm nào sắp hết hàng?"
            value={typedMessage}
            disabled={sending}
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
            size="large"
            icon={<SendOutlined />}
            loading={sending}
            disabled={sending || !typedMessage.trim()}
            onClick={() => void handleSendMessage()}
          />
        </div>
      </Card>
    </div>
  );
}
