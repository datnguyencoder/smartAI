import React from 'react';
import { useChat } from '@/contexts/ChatContext';

export function ChatHeader() {
  const { selectedConversation } = useChat();

  if (!selectedConversation) return null;

  return (
    <div className="h-16 flex items-center justify-between border-b border-slate-200 bg-white px-6 shrink-0 shadow-sm z-10 relative">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 shrink-0 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-lg overflow-hidden">
          {selectedConversation.avatar ? (
            <img src={selectedConversation.avatar} alt={selectedConversation.name} className="h-full w-full object-cover" />
          ) : (
            selectedConversation.name.charAt(0).toUpperCase()
          )}
        </div>
        <div>
          <h2 className="text-base font-semibold text-slate-800">{selectedConversation.name}</h2>
          <div className="flex items-center gap-1.5 mt-0.5">
            {/* TODO: Phase 9 Online status */}
            <span className="h-2 w-2 rounded-full bg-green-500"></span>
            <span className="text-xs text-slate-500">Đang hoạt động</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-blue-600 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
        </button>
        <button className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-blue-600 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </button>
        <button className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
