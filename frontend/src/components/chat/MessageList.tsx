import React, { useRef, useEffect } from 'react';
import { useChat } from '@/contexts/ChatContext';
import { useAuth } from '@/contexts/AuthContext';
import { chatApi } from '@/services/chatApi';
import { MessageBubble } from './MessageBubble';
import { RecallMessageModal } from './RecallMessageModal';
import { EditMessageModal } from './EditMessageModal';
import { useState } from 'react';

interface MessageListProps {
  onLoadMore?: () => void;
}

export function MessageList({ onLoadMore }: MessageListProps) {
  const { messages, hasMoreMessages } = useChat();
  const { authUser } = useAuth();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [recallMessageId, setRecallMessageId] = useState<number | null>(null);
  const [editMessageData, setEditMessageData] = useState<{ id: number; content: string } | null>(null);

  // TODO: Reverse infinite scroll logic (Phase 3)
  const handleScroll = () => {
    if (scrollRef.current) {
      if (scrollRef.current.scrollTop === 0 && hasMoreMessages && onLoadMore) {
        onLoadMore();
      }
    }
  };

  useEffect(() => {
    // Scroll to bottom on initial load
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]); // Only scroll to bottom on new messages, logic needs refinement later

  const handleEditClick = (msgId: number, currentContent: string) => {
    setEditMessageData({ id: msgId, content: currentContent });
  };

  const handleConfirmEdit = async (newContent: string) => {
    if (!editMessageData) return;
    try {
      await chatApi.editMessage(editMessageData.id, { content: newContent });
      setEditMessageData(null);
    } catch (e) {
      console.error('Failed to edit message', e);
      alert('Lỗi khi sửa tin nhắn');
    }
  };

  const handleRecallClick = (msgId: number) => {
    setRecallMessageId(msgId);
  };

  const handleConfirmRecall = async (option: 'EVERYONE' | 'ONLY_ME') => {
    if (!recallMessageId) return;
    
    if (option === 'ONLY_ME') {
      alert('Tính năng xóa ở phía bạn đang được phát triển!');
      setRecallMessageId(null);
      return;
    }

    try {
      await chatApi.recallMessage(recallMessageId);
      setRecallMessageId(null);
    } catch (e) {
      console.error('Failed to recall message', e);
      alert('Lỗi khi thu hồi tin nhắn');
    }
  };

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-400 p-4">
        <p>Bắt đầu cuộc trò chuyện...</p>
      </div>
    );
  }

  return (
    <div 
      ref={scrollRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 bg-slate-50/50"
    >
      {hasMoreMessages && (
        <div className="text-center py-2">
          <button onClick={onLoadMore} className="text-xs text-blue-500 font-medium hover:underline">
            Tải thêm tin nhắn cũ
          </button>
        </div>
      )}
      {/* Messages should be sorted by chronological order (oldest top, newest bottom) */}
      {messages.map((msg, index) => {
        const isMine = msg.senderId === authUser?.id;
        return (
          <MessageBubble
            key={msg.id || index}
            message={msg}
            isMine={isMine}
            onEdit={() => handleEditClick(msg.id, msg.content || '')}
            onRecall={() => handleRecallClick(msg.id)}
          />
        );
      })}

      <RecallMessageModal 
        isOpen={recallMessageId !== null} 
        onClose={() => setRecallMessageId(null)} 
        onConfirm={handleConfirmRecall} 
      />
      
      <EditMessageModal
        isOpen={editMessageData !== null}
        onClose={() => setEditMessageData(null)}
        initialContent={editMessageData?.content || ''}
        onConfirm={handleConfirmEdit}
      />
    </div>
  );
}
