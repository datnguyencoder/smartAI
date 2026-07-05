import React, { useRef, useState } from 'react';
import { useChat } from '@/contexts/ChatContext';

interface MessageInputProps {
  onSend: (content: string) => void;
  onSendImage?: (file: File) => void;
  isUploading?: boolean;
}

export function MessageInput({ onSend, onSendImage, isUploading }: MessageInputProps) {
  const { selectedConversation } = useChat();
  const [text, setText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!text.trim() || !selectedConversation || isUploading) return;

    onSend(text);
    setText('');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onSendImage) {
      onSendImage(file);
    }
    // Reset input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (!selectedConversation) return null;

  return (
    <div className="p-4 bg-white border-t border-slate-200 shrink-0">
      <form onSubmit={handleSend} className="flex items-end gap-2 bg-slate-100 rounded-2xl px-4 py-2 focus-within:ring-2 focus-within:ring-blue-500/30 transition-shadow">
        <input 
          type="file" 
          accept="image/*" 
          className="hidden" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          disabled={isUploading}
        />
        <button 
          type="button" 
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="p-2 text-slate-400 hover:text-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0 flex items-center justify-center relative" 
          title="Ảnh"
        >
          {isUploading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          )}
        </button>
        
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Nhập tin nhắn..."
          className="flex-1 bg-transparent border-none focus:ring-0 px-2 py-2 text-sm max-h-32 min-h-[40px] outline-none"
        />

        <button type="button" className="p-2 text-slate-400 hover:text-blue-500 transition-colors shrink-0" title="Biểu tượng cảm xúc">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
        
        <button 
          type="submit" 
          disabled={!text.trim()}
          className="p-2 text-blue-600 disabled:text-slate-300 disabled:cursor-not-allowed hover:bg-blue-50 rounded-full transition-colors shrink-0"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </form>
    </div>
  );
}
