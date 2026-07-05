import React from 'react';
import { cn } from '@/lib/utils';
import type { Message } from '@/types/chat';

interface MessageBubbleProps {
  message: Message;
  isMine: boolean;
  onEdit: () => void;
  onRecall: () => void;
}

function formatTime(isoString?: string) {
  if (!isoString) return '';
  const date = new Date(isoString);
  return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

export function MessageBubble({ message, isMine, onEdit, onRecall }: MessageBubbleProps) {
  if (message.messageType === 'SYSTEM') {
    return (
      <div className="flex justify-center my-2">
        <span className="bg-slate-100 text-slate-500 text-xs px-3 py-1 rounded-full">
          {message.content}
        </span>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col w-full max-w-[70%]", isMine ? "self-end items-end" : "self-start items-start")}>
      {!isMine && (
        <span className="text-xs text-slate-500 mb-1 ml-1">{message.senderName}</span>
      )}
      
      {/* Reply Reference if exists */}
      {message.replyToMessageId && (
        <div className={cn(
          "text-xs p-2 mb-1 rounded bg-slate-100 border-l-2 border-blue-400 text-slate-500 truncate max-w-full opacity-80",
          isMine ? "mr-2" : "ml-2"
        )}>
          {message.replyToContent || "Tin nhắn trả lời..."}
        </div>
      )}

      <div className="flex items-end gap-2 group relative">
        {!isMine && (
          <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-600 flex-shrink-0 flex items-center justify-center text-xs font-bold">
             {message.senderName?.charAt(0).toUpperCase() || 'U'}
          </div>
        )}

        <div className={cn(
          "relative",
          (!message.recalled && message.messageType === 'IMAGE')
            ? ""
            : cn("px-4 py-2.5 rounded-2xl", isMine ? "bg-blue-600 text-white rounded-br-sm" : "bg-white border border-slate-200 text-slate-800 rounded-bl-sm shadow-sm")
        )}>
          {message.recalled ? (
            <span className={cn("italic opacity-70", isMine ? "text-blue-100" : "text-slate-400")}>Tin nhắn đã bị thu hồi</span>
          ) : (
            <div className="break-words text-[15px] leading-relaxed">
              {message.messageType !== 'IMAGE' && message.content}
              
              {/* Attachments */}
              {message.attachments && message.attachments.length > 0 && (
                <div className={cn("flex flex-col gap-1", message.messageType !== 'IMAGE' ? "mt-2" : "")}>
                  {message.attachments.map(att => {
                    if (message.messageType === 'IMAGE' || att.fileType?.startsWith('image/')) {
                      return (
                        <a key={att.id} href={att.url} target="_blank" rel="noreferrer" className="block max-w-[240px] rounded-2xl overflow-hidden shadow-sm border border-black/5">
                          <img src={att.url} alt="attachment" className="w-full h-auto object-cover hover:opacity-90 transition-opacity block" />
                        </a>
                      );
                    }
                    return (
                      <a key={att.id} href={att.url} target="_blank" rel="noreferrer" className="text-xs flex items-center gap-1 bg-black/10 p-1.5 rounded hover:bg-black/20 transition-colors">
                        📎 {att.publicId || 'Tệp đính kèm'}
                      </a>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Menu (Hover) */}
        {!message.recalled && isMine && (
          <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute top-0 -left-12 flex items-center gap-1 bg-white shadow-sm border border-slate-200 rounded-lg p-1">
            <button onClick={onEdit} className="p-1 hover:bg-slate-100 text-slate-500 rounded" title="Sửa">✏️</button>
            <button onClick={onRecall} className="p-1 hover:bg-slate-100 text-red-500 rounded" title="Thu hồi">🗑️</button>
          </div>
        )}
      </div>
      
      <div className="flex items-center gap-2 mt-1 mx-1">
        <span className="text-[11px] text-slate-400">{formatTime(message.createdAt)}</span>
        {message.edited && !message.recalled && <span className="text-[10px] text-slate-400 italic">đã chỉnh sửa</span>}
      </div>
    </div>
  );
}
