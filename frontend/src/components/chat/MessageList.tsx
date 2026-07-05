import React, { useRef, useEffect } from 'react';
import { useChat } from '@/contexts/ChatContext';
import { useAuth } from '@/contexts/AuthContext';
import { MessageBubble } from './MessageBubble';

interface MessageListProps {
  onLoadMore?: () => void;
}

export function MessageList({ onLoadMore }: MessageListProps) {
  const { messages, hasMoreMessages } = useChat();
  const { authUser } = useAuth();
  const scrollRef = useRef<HTMLDivElement>(null);

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
            onEdit={() => console.log('Edit message', msg.id)}
            onRecall={() => console.log('Recall message', msg.id)}
          />
        );
      })}
    </div>
  );
}
