import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import type { UserDto } from '@/types/api';
import { fetchUsers } from '@/services/userApi';
import { useAuth } from '@/contexts/AuthContext';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, memberIds: number[]) => Promise<void>;
}

export function CreateGroupModal({ isOpen, onClose, onCreate }: CreateGroupModalProps) {
  const { authUser } = useAuth();
  const [name, setName] = useState('');
  const [users, setUsers] = useState<UserDto[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [search, setSearch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchUsers().then(setUsers).catch(console.error);
      setName('');
      setSelectedIds([]);
      setSearch('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleToggleUser = (id: number) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSubmit = async () => {
    if (selectedIds.length === 0) {
      alert('Vui lòng chọn ít nhất 1 thành viên');
      return;
    }
    setIsSubmitting(true);
    try {
      await onCreate(name, selectedIds);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.id !== authUser?.id && 
    (u.fullName?.toLowerCase().includes(search.toLowerCase()) || 
     u.username?.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">Tạo nhóm mới</h2>
          <button 
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-4 flex flex-col gap-4 overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tên nhóm</label>
            <input 
              type="text" 
              placeholder="Nhập tên nhóm..." 
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Thêm thành viên</label>
            <input 
              type="text" 
              placeholder="Tìm kiếm người dùng..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            
            <div className="border border-slate-200 rounded-lg max-h-60 overflow-y-auto bg-slate-50">
              {filteredUsers.length === 0 ? (
                <div className="p-4 text-center text-sm text-slate-500">Không tìm thấy người dùng</div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {filteredUsers.map(u => (
                    <label key={u.id} className="flex items-center gap-3 p-3 hover:bg-slate-100 cursor-pointer transition-colors bg-white">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        checked={selectedIds.includes(u.id)}
                        onChange={() => handleToggleUser(u.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-slate-900 truncate">{u.fullName || u.username}</div>
                        <div className="text-xs text-slate-500 truncate">@{u.username}</div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200 bg-slate-100 rounded-lg transition-colors"
          >
            Hủy
          </button>
          <button 
            onClick={handleSubmit}
            disabled={isSubmitting || selectedIds.length === 0}
            className="px-6 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Đang tạo...' : 'Tạo nhóm'}
          </button>
        </div>
      </div>
    </div>
  );
}
