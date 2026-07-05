import React from 'react';
import { cn } from '@/lib/utils';
import type { Conversation } from '@/types/chat';

interface ConversationItemProps {
  conversation: Conversation;
  isSelected: boolean;
  onClick: () => void;
}

function formatTime(isoString?: string) {
  if (!isoString) return '';
  const date = new Date(isoString);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  
  if (isToday) {
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  }
  return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
}

export function ConversationItem({ conversation, isSelected, onClick }: ConversationItemProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'group flex cursor-pointer items-center gap-3 p-3 transition-colors border-b border-slate-100 last:border-b-0',
        isSelected ? 'bg-blue-50' : 'hover:bg-slate-100'
      )}
    >
      <div className="relative shrink-0">
        <div className="h-12 w-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-lg overflow-hidden">
          {conversation.avatar ? (
            <img src={conversation.avatar} alt={conversation.name} className="h-full w-full object-cover" />
          ) : (
            conversation.name.charAt(0).toUpperCase()
          )}
        </div>
        {conversation.type === 'GROUP' && (
          <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-slate-600" viewBox="0 0 20 20" fill="currentColor">
              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
            </svg>
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <h3 className={cn("truncate text-sm", conversation.unreadCount > 0 ? "font-bold text-slate-900" : "font-semibold text-slate-800")}>
            {conversation.name}
          </h3>
          <span className={cn("text-xs shrink-0 ml-2", conversation.unreadCount > 0 ? "font-semibold text-blue-600" : "text-slate-400")}>
            {formatTime(conversation.lastMessageAt)}
          </span>
        </div>
        <div className="flex items-center justify-between mt-0.5">
          <p className={cn("truncate text-sm", conversation.unreadCount > 0 ? "font-semibold text-slate-900" : "text-slate-500")}>
            {conversation.lastMessage ? (
              <>
                <span className={cn("mr-1", conversation.unreadCount > 0 ? "font-bold" : "font-medium")}>
                  {conversation.lastMessage.senderName}:
                </span>
                {conversation.lastMessage.content}
              </>
            ) : 'Chưa có tin nhắn'}
          </p>
          {conversation.unreadCount > 0 && (
            <span className="ml-2 h-2.5 w-2.5 shrink-0 rounded-full bg-blue-600"></span>
          )}
        </div>
      </div>
    </div>
  );
}
