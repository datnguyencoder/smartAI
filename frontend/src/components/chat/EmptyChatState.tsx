import React from 'react';

export function EmptyChatState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-slate-50/30">
      <div className="h-24 w-24 rounded-full bg-blue-50 flex items-center justify-center mb-6 border-8 border-white shadow-sm">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </div>
      <h3 className="text-xl font-semibold text-slate-700 mb-2">Chào mừng đến với Tin nhắn</h3>
      <p className="text-sm max-w-sm text-center">
        Chọn một đoạn chat ở danh sách bên trái hoặc bắt đầu một cuộc trò chuyện mới để kết nối với mọi người.
      </p>
    </div>
  );
}
