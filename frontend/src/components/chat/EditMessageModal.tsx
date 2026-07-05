import React, { useState, useEffect } from 'react';

interface EditMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialContent: string;
  onConfirm: (newContent: string) => void;
}

export function EditMessageModal({ isOpen, onClose, initialContent, onConfirm }: EditMessageModalProps) {
  const [content, setContent] = useState('');

  useEffect(() => {
    if (isOpen) {
      setContent(initialContent);
    }
  }, [isOpen, initialContent]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim() && content.trim() !== initialContent) {
      onConfirm(content.trim());
      onClose();
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-800">Sửa tin nhắn</h3>
          <button 
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors"
          >
            ✕
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-5">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full border border-slate-300 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none h-24"
            autoFocus
            placeholder="Nhập nội dung mới..."
          />
          
          <div className="flex items-center justify-end gap-3 mt-4">
            <button 
              type="button"
              onClick={onClose}
              className="px-5 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Hủy
            </button>
            <button 
              type="submit"
              disabled={!content.trim() || content.trim() === initialContent}
              className="px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 rounded-xl transition-colors"
            >
              Lưu thay đổi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
