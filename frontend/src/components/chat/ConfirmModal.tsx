import React from 'react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  isDanger?: boolean;
}

export function ConfirmModal({ 
  isOpen, 
  onClose, 
  title, 
  message, 
  confirmText = 'Xác nhận', 
  cancelText = 'Hủy', 
  onConfirm,
  isDanger = false
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-800">{title}</h3>
          <button 
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors"
          >
            ✕
          </button>
        </div>
        
        <div className="p-5">
          <p className="text-slate-600 text-sm">{message}</p>
          
          <div className="flex items-center justify-end gap-3 mt-6">
            <button 
              type="button"
              onClick={onClose}
              className="px-5 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              {cancelText}
            </button>
            <button 
              type="button"
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`px-5 py-2 text-sm font-medium text-white rounded-xl transition-colors ${
                isDanger 
                  ? 'bg-red-600 hover:bg-red-700' 
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
