import React from 'react';
import { useChat } from '@/contexts/ChatContext';
import { ConversationItem } from './ConversationItem';

export function ConversationList({ searchQuery = '' }: { searchQuery?: string }) {
  const { conversations, selectedConversation, setSelectedConversation } = useChat();

  const filteredConversations = React.useMemo(() => {
    if (!searchQuery) return conversations;
    const lowerQ = searchQuery.toLowerCase();
    return conversations.filter(c => {
      return c.name?.toLowerCase().includes(lowerQ) || c.lastMessage?.senderName?.toLowerCase().includes(lowerQ);
    });
  }, [conversations, searchQuery]);

  if (filteredConversations.length === 0) {
    return (
      <div className="p-4 text-center text-sm text-slate-500">
        Chưa có cuộc trò chuyện nào.
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {filteredConversations.map((conv) => (
        <ConversationItem
          key={conv.id}
          conversation={conv}
          isSelected={selectedConversation?.id === conv.id}
          onClick={() => setSelectedConversation(conv)}
        />
      ))}
    </div>
  );
}
