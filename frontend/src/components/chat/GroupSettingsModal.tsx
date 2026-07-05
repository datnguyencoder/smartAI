import React, { useState, useEffect } from 'react';
import { chatApi } from '@/services/chatApi';
import type { Conversation, MemberResponse } from '@/types/chat';
import { useAuth } from '@/contexts/AuthContext';
import { fetchUsers } from '@/services/userApi';
import type { UserDto } from '@/types/api';
import { ConfirmModal } from './ConfirmModal';

interface GroupSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId: number;
  onGroupUpdated: () => void; // Trigger refresh in parent
  onGroupLeft: () => void; // Trigger UI reset when leaving
}

export function GroupSettingsModal({ isOpen, onClose, conversationId, onGroupUpdated, onGroupLeft }: GroupSettingsModalProps) {
  const { authUser } = useAuth();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [members, setMembers] = useState<MemberResponse[]>([]);
  const [loading, setLoading] = useState(true);
  
  // States for renaming
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState('');

  // States for adding members
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [allUsers, setAllUsers] = useState<UserDto[]>([]);
  const [searchUser, setSearchUser] = useState('');

  const loadDetail = async () => {
    try {
      setLoading(true);
      const detail = await chatApi.getConversationDetail(conversationId);
      setConversation(detail);
      setMembers(detail.members || []);
    } catch (e) {
      console.error('Failed to load group detail', e);
    } finally {
      setLoading(false);
    }
  };

  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    isDanger?: boolean;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  useEffect(() => {
    if (isOpen) {
      loadDetail();
      fetchUsers().then(setAllUsers).catch(console.error);
    }
  }, [isOpen, conversationId]);

  if (!isOpen || !conversation) return null;

  const myMemberInfo = members.find(m => m.userId === authUser?.id);
  const isOwner = myMemberInfo?.role === 'OWNER';

  const handleRename = async () => {
    if (!newName.trim() || newName.trim() === conversation.name) {
      setIsRenaming(false);
      return;
    }
    try {
      await chatApi.renameGroup(conversationId, newName.trim());
      await loadDetail();
      onGroupUpdated();
      setIsRenaming(false);
    } catch (e: any) {
      alert('Đổi tên thất bại: ' + (e.message || ''));
    }
  };

  const handleLeaveGroup = () => {
    setConfirmConfig({
      isOpen: true,
      title: 'Rời khỏi nhóm',
      message: 'Bạn có chắc chắn muốn rời khỏi nhóm này không?',
      isDanger: true,
      onConfirm: async () => {
        try {
          await chatApi.leaveGroup(conversationId);
          onGroupLeft();
          onClose();
        } catch (e: any) {
          alert('Rời nhóm thất bại: ' + (e.message || ''));
        }
      }
    });
  };

  const handleKickMember = (userId: number, name: string) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Xóa thành viên',
      message: `Bạn có chắc muốn xóa ${name} khỏi nhóm?`,
      isDanger: true,
      onConfirm: async () => {
        try {
          await chatApi.removeMember(conversationId, userId);
          await loadDetail();
          onGroupUpdated();
        } catch (e: any) {
          alert('Xóa thành viên thất bại: ' + (e.message || ''));
        }
      }
    });
  };

  const handleAddMember = async (userId: number) => {
    try {
      await chatApi.addMember(conversationId, userId);
      await loadDetail();
      onGroupUpdated();
      setIsAddingMember(false);
      setSearchUser('');
    } catch (e: any) {
      alert('Thêm thành viên thất bại: ' + (e.message || ''));
    }
  };

  const availableUsersToAdd = allUsers.filter(u => 
    !members.some(m => m.userId === u.id) && 
    (u.fullName?.toLowerCase().includes(searchUser.toLowerCase()) || 
     u.username?.toLowerCase().includes(searchUser.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-[100] flex justify-end bg-black/20 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">Cài đặt nhóm</h2>
          <button 
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200"
          >
            ✕
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-500">Đang tải...</div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            {/* Group Info Section */}
            <div className="flex flex-col items-center p-6 border-b border-slate-100">
              <div className="h-20 w-20 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-3xl mb-4">
                {conversation.name.charAt(0).toUpperCase()}
              </div>
              
              {isRenaming ? (
                <form 
                  onSubmit={(e) => { e.preventDefault(); handleRename(); }}
                  className="flex items-center gap-2 w-full mt-2"
                >
                  <input 
                    type="text" 
                    defaultValue={conversation.name}
                    onChange={e => setNewName(e.target.value)}
                    className="flex-1 border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    autoFocus
                  />
                  <button type="submit" className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-blue-700 transition-colors">Lưu</button>
                  <button type="button" onClick={() => setIsRenaming(false)} className="text-sm bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg font-medium hover:bg-slate-200 transition-colors">Hủy</button>
                </form>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <div className="flex items-center gap-2 group">
                    <h3 className="text-xl font-bold text-slate-900 text-center">{conversation.name}</h3>
                    {isOwner && (
                      <button 
                        onClick={() => { setIsRenaming(true); setNewName(conversation.name); }} 
                        className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all" 
                        title="Đổi tên nhóm"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Members Section */}
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-slate-800">Thành viên ({members.length})</h4>
                {isOwner && (
                  <button 
                    onClick={() => setIsAddingMember(!isAddingMember)}
                    className="text-sm text-blue-600 font-medium hover:underline"
                  >
                    {isAddingMember ? 'Hủy thêm' : '+ Thêm người'}
                  </button>
                )}
              </div>

              {isAddingMember && (
                <div className="mb-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <input 
                    type="text" 
                    placeholder="Tìm kiếm..." 
                    value={searchUser}
                    onChange={e => setSearchUser(e.target.value)}
                    className="w-full border border-slate-200 rounded px-2 py-1 text-sm mb-2"
                  />
                  <div className="max-h-40 overflow-y-auto divide-y divide-slate-100">
                    {availableUsersToAdd.length === 0 ? (
                      <p className="text-xs text-slate-500 text-center py-2">Không tìm thấy ai</p>
                    ) : (
                      availableUsersToAdd.map(u => (
                        <div key={u.id} className="flex items-center justify-between py-2">
                          <span className="text-sm font-medium">{u.fullName || u.username}</span>
                          <button 
                            onClick={() => handleAddMember(u.id)}
                            className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
                          >
                            Thêm
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {members.map(member => (
                  <div key={member.userId} className="flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-sm font-medium text-slate-600">
                        {member.fullName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {member.fullName} {member.userId === authUser?.id && '(Bạn)'}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {member.role === 'OWNER' ? 'Trưởng nhóm' : 'Thành viên'}
                        </p>
                      </div>
                    </div>
                    
                    {isOwner && member.userId !== authUser?.id && (
                      <button 
                        onClick={() => handleKickMember(member.userId, member.fullName)}
                        className="opacity-0 group-hover:opacity-100 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded transition-all"
                      >
                        Xóa
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            {/* Danger Zone */}
            <div className="p-4 border-t border-slate-100 flex justify-end">
              <button 
                onClick={handleLeaveGroup}
                className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
                </svg>
                Rời nhóm
              </button>
            </div>
          </div>
        )}
      </div>

      <ConfirmModal 
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
        title={confirmConfig.title}
        message={confirmConfig.message}
        isDanger={confirmConfig.isDanger}
        onConfirm={confirmConfig.onConfirm}
        confirmText="Đồng ý"
      />
    </div>
  );
}
