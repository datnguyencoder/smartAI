import { apiRequest } from './apiClient';
import { getAccessToken } from '@/lib/authSession';
import { API_BASE_URL } from '@/lib/env';
import type { Conversation, Message } from '@/types/chat';
import type { PageResponseDto } from '@/types/api';

export const chatApi = {
  uploadImage: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const token = getAccessToken();
    const res = await fetch(`${API_BASE_URL}/api/v1/media/upload`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: formData
    });
    const body = await res.json();
    if (!res.ok || !body.success) throw new Error(body.message || 'Upload failed');
    return body.data as string;
  },

  getMyConversations: (page = 0, size = 20) =>
    apiRequest<PageResponseDto<Conversation>>(`/api/v1/chat/conversations?page=${page}&size=${size}`),

  getConversationDetail: (conversationId: number) =>
    apiRequest<Conversation>(`/api/v1/chat/conversations/${conversationId}`),

  createPrivateConversation: (targetUserId: number) =>
    apiRequest<Conversation>(`/api/v1/chat/conversations/private/${targetUserId}`, { method: 'POST' }),

  createGroupConversation: (payload: { name: string; memberIds: number[] }) =>
    apiRequest<Conversation>('/api/v1/chat/conversations/group', { method: 'POST', body: JSON.stringify(payload) }),

  getMessages: (conversationId: number, page = 0, size = 30) =>
    apiRequest<PageResponseDto<Message>>(`/api/v1/chat/conversations/${conversationId}/messages?page=${page}&size=${size}`),

  sendTextMessage: (payload: { conversationId: number; content: string }) =>
    apiRequest<Message>('/api/v1/chat/messages/text', { method: 'POST', body: JSON.stringify(payload) }),

  sendImageMessage: (payload: { conversationId: number; url: string; publicId: string; fileType: string; fileSize: number }) =>
    apiRequest<Message>('/api/v1/chat/messages/image', { method: 'POST', body: JSON.stringify(payload) }),

  recallMessage: (messageId: number) =>
    apiRequest<void>(`/api/v1/chat/messages/${messageId}/recall`, { method: 'POST' }),

  editMessage: (messageId: number, payload: { content: string }) =>
    apiRequest<void>(`/api/v1/chat/messages/${messageId}`, { method: 'PUT', body: JSON.stringify(payload) }),

  replyMessage: (payload: { conversationId: number; content: string; replyToMessageId: number }) =>
    apiRequest<Message>('/api/v1/chat/messages/reply', { method: 'POST', body: JSON.stringify(payload) }),
};
