import React, { useState } from 'react';
import { cn } from '@/lib/utils';

interface RecallMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (option: 'EVERYONE' | 'ONLY_ME') => void;
}

export function RecallMessageModal({ isOpen, onClose, onConfirm }: RecallMessageModalProps) {
  const [selectedOption, setSelectedOption] = useState<'EVERYONE' | 'ONLY_ME'>('EVERYONE');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] w-full max-w-md overflow-hidden flex flex-col border border-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <h2 className="text-[17px] font-bold text-slate-800 text-center flex-1 ml-8">
            Bạn muốn thu hồi tin nhắn này ở phía ai?
          </h2>
          <button 
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors shrink-0"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-2">
          {/* Option 1: Everyone */}
          <div 
            className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
            onClick={() => setSelectedOption('EVERYONE')}
          >
            <div className="mt-1 flex-shrink-0">
              <div className={cn(
                "h-5 w-5 rounded-full border-[6px] flex items-center justify-center transition-all",
                selectedOption === 'EVERYONE' ? "border-blue-600 bg-white" : "border-slate-300 bg-transparent border-2"
              )}>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-[15px] text-slate-900 leading-none">Thu hồi với mọi người</h3>
              <p className="text-[13px] text-slate-500 mt-1.5 leading-relaxed">
                Tin nhắn này sẽ bị thu hồi với mọi người trong đoạn chat. Những người khác có thể đã xem hoặc chuyển tiếp tin nhắn đó. Tin nhắn đã thu hồi vẫn có thể bị báo cáo.
              </p>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 flex items-center justify-end gap-3 mt-2">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-[15px] font-semibold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            Hủy
          </button>
          <button 
            onClick={() => onConfirm(selectedOption)}
            className="px-6 py-2 text-[15px] font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            Gỡ
          </button>
        </div>
      </div>
    </div>
  );
}
