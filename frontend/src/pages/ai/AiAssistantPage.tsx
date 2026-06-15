import { Button, Input } from 'antd';
import { Send } from 'lucide-react';
import * as React from 'react';
import { MarkdownMessage } from '@/components/ai/MarkdownMessage';
import { Card, CardHeader } from '@/components/ui';
import { type Product } from '@/lib/itemMapper';
import { cn } from '@/lib/utils';
import { aiChat } from '@/services/wmsApi';
import type { PageKey } from '@/types/pages';

export default function AiAssistantPage({
  productsList,
  chatHistory,
  setChatHistory,
  setPage,
}: {
  productsList: Product[];
  chatHistory: Array<{ sender: 'user' | 'ai'; text: string; action?: { label: string; page: PageKey } }>;
  setChatHistory: React.Dispatch<React.SetStateAction<Array<{ sender: 'user' | 'ai'; text: string; action?: { label: string; page: PageKey } }>>>;
  setPage: (page: PageKey) => void;
}) {
  const [typedMessage, setTypedMessage] = React.useState('');
  const chatEndRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const handleSendMessage = () => {
    if (!typedMessage.trim()) return;

    const userMsg = typedMessage;
    const newHistory = [...chatHistory, { sender: 'user' as const, text: userMsg }];
    setChatHistory(newHistory);
    setTypedMessage('');

    aiChat(userMsg)
      .then((aiText) => {
        const lower = userMsg.toLowerCase();
        let action: { label: string; page: PageKey } | undefined;
        if (lower.includes('nhập') || lower.includes('tồn')) {
          action = { label: 'Tạo phiếu nhập', page: 'import-create' };
        } else if (lower.includes('báo cáo') || lower.includes('doanh thu')) {
          action = { label: 'Xem báo cáo', page: 'reports' };
        }
        setChatHistory([...newHistory, { sender: 'ai' as const, text: aiText, action }]);
      })
      .catch(() => {
        setChatHistory([
          ...newHistory,
          {
            sender: 'ai' as const,
            text: 'Không kết nối được trợ lý AI. Vui lòng thử lại hoặc kiểm tra quyền ADMIN/MANAGER.',
          },
        ]);
      });
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
      <Card className="min-h-[580px] flex flex-col justify-between">
        <CardHeader title="Trợ lý vận hành thông minh AI" description="Hỏi đáp thời gian thực về tồn kho, đề xuất nhập hàng và hiệu quả doanh thu." />
        <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-4 max-h-[380px] scrollbar-thin">
          {chatHistory.map((msg, i) => (
            <div
              key={i}
              className={cn(
                'flex flex-col max-w-[80%] rounded-2xl p-4 text-sm relative',
                msg.sender === 'user'
                  ? 'ml-auto bg-primary text-white shadow-md'
                  : 'bg-slate-100 text-slate-800 shadow-sm border border-slate-200'
              )}
            >
              {msg.sender === 'ai' ? <MarkdownMessage text={msg.text} /> : <span>{msg.text}</span>}
              {msg.action && (
                <Button
                  className="mt-3 font-semibold text-xs h-8 bg-white border border-indigo/20 text-indigo hover:text-indigo-700"
                  onClick={() => setPage(msg.action!.page)}
                >
                  {msg.action.label}
                </Button>
              )}
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl flex gap-2">
          <Input
            size="large"
            placeholder="Ví dụ: 'Sản phẩm nào sắp hết hàng?'..."
            value={typedMessage}
            onChange={(e) => setTypedMessage(e.target.value)}
            onPressEnter={handleSendMessage}
          />
          <Button type="primary" size="large" icon={<Send size={17} />} onClick={handleSendMessage} />
        </div>
      </Card>
    </div>
  );
}
