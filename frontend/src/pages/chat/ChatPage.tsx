import React, { useEffect, useState, useRef } from 'react';
import { Card } from '@/components/ui';
import { ChatProvider, useChat } from '@/contexts/ChatContext';
import { ConversationList } from '@/components/chat/ConversationList';
import { ChatHeader } from '@/components/chat/ChatHeader';
import { MessageList } from '@/components/chat/MessageList';
import { MessageInput } from '@/components/chat/MessageInput';
import { EmptyChatState } from '@/components/chat/EmptyChatState';
import { CreateGroupModal } from '@/components/chat/CreateGroupModal';
import { GroupSettingsModal } from '@/components/chat/GroupSettingsModal';
import { chatApi } from '@/services/chatApi';
import type { Message } from '@/types/chat';
import { useAuth } from '@/contexts/AuthContext';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { fetchUsers } from '@/services/userApi';
import type { UserDto } from '@/types/api';

function ChatContent() {
  const { 
    conversations,
    setConversations, 
    selectedConversation, 
    setSelectedConversation,
    setMessages,
    messagePage,
    setMessagePage,
    setHasMoreMessages,
    hasMoreMessages
  } = useChat();
  const { token, authUser } = useAuth();
  const stompClientRef = useRef<Client | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<UserDto[]>([]);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [isGroupSettingsOpen, setIsGroupSettingsOpen] = useState(false);

  useEffect(() => {
    fetchUsers().then(setUsers).catch(console.error);
  }, []);

  const handleStartChat = async (targetUser: UserDto) => {
    try {
      const res = await chatApi.createPrivateConversation(targetUser.id);
      setSelectedConversation(res);
      fetchConversations();
    } catch (e) {
      console.error('Failed to create chat', e);
    }
  };

  const handleCreateGroup = async (name: string, memberIds: number[]) => {
    if (!authUser) return;
    try {
      const res = await chatApi.createGroupConversation({
        name,
        memberIds: [...memberIds, authUser.id]
      });
      setSelectedConversation(res);
      setIsCreatingGroup(false);
      fetchConversations();
    } catch (e: any) {
      console.error('Failed to create group', e);
      alert('Lỗi khi tạo nhóm: ' + (e.message || ''));
    }
  };

  const unifiedUsers = (searchQuery ? users.filter(u => 
    u.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.username?.toLowerCase().includes(searchQuery.toLowerCase())
  ) : users).filter(
    (u) => u.id !== authUser?.id && !conversations.some((c) => 
      c.name?.toLowerCase() === u.fullName?.toLowerCase() || 
      c.name?.toLowerCase() === u.username?.toLowerCase()
    )
  );

  const fetchConversations = async () => {
    try {
      const res = await chatApi.getMyConversations(0, 50);
      setConversations(res.content);
    } catch (error) {
      console.error('Failed to load conversations', error);
    }
  };

  const fetchMessages = async (convId: number) => {
    try {
      const res = await chatApi.getMessages(convId, 0, 30);
      const content = res.content;
      setMessages([...content].reverse());
      setHasMoreMessages(!res.last);
      setMessagePage(0);
    } catch (error) {
      console.error('Failed to load messages', error);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, [setConversations]);

  useEffect(() => {
    if (selectedConversation) {
      setMessages([]);
      fetchMessages(selectedConversation.id);
      
      chatApi.markConversationAsRead(selectedConversation.id).then(() => {
        fetchConversations();
      }).catch(console.error);
    }
  }, [selectedConversation, setMessages, setHasMoreMessages]);

  const handleMessageReceived = async (message: Message) => {
    setMessages(prev => {
      if (prev.some(m => m.id === message.id)) return prev;
      return [...prev, message];
    });
    
    if (selectedConversation && message.conversationId === selectedConversation.id) {
      try {
        await chatApi.markConversationAsRead(selectedConversation.id);
        fetchConversations();
      } catch (e) {
        console.error(e);
      }
    }
  };

  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!token) return;

    const client = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
      connectHeaders: {
        Authorization: `Bearer ${token}`
      },
      reconnectDelay: 5000,
      debug: (str) => console.log('STOMP: ', str),
      onConnect: () => {
        console.log('STOMP connected');
        setIsConnected(true);
      },
      onDisconnect: () => {
        setIsConnected(false);
      },
      onStompError: (frame) => {
        console.error('Broker reported error: ' + frame.headers['message']);
        console.error('Additional details: ' + frame.body);
      }
    });

    client.activate();
    stompClientRef.current = client;

    return () => {
      client.deactivate();
      setIsConnected(false);
    };
  }, [token]);

  useEffect(() => {
    if (!isConnected || !stompClientRef.current || !selectedConversation) return;

    const client = stompClientRef.current;
    
    // Subscribe to the topic
    const sub = client.subscribe(`/topic/chat/${selectedConversation.id}`, (message) => {
      console.log('=== STOMP RAW body ===', message.body);
      const event = JSON.parse(message.body);
      console.log('=== STOMP parsed event ===', event);
      console.log('=== event.type ===', event.type, '=== typeof ===', typeof event.type);
      if (event.type === 'NEW_MESSAGE') {
        console.log('=== Handling NEW_MESSAGE ===', event.data);
        handleMessageReceived(event.data);
      } else if (event.type === 'MESSAGE_RECALLED' || event.type === 'MESSAGE_EDITED') {
        setMessages(prev => prev.map(m => m.id === event.data.id ? event.data : m));
      } else {
        console.warn('=== Unknown event type, not handled ===', event.type);
      }
    });

    return () => {
      console.log('Unsubscribing from conversation: ', selectedConversation.id);
      sub.unsubscribe();
    };
  }, [isConnected, selectedConversation]);

  // Global notification subscription to update conversation list (e.g., when a message arrives in a background chat)
  useEffect(() => {
    if (!isConnected || !stompClientRef.current || !authUser) return;

    const client = stompClientRef.current;
    const sub = client.subscribe(`/topic/notifications/${authUser.id}`, (message) => {
      console.log('=== Received background notification ===', message.body);
      const event = JSON.parse(message.body);
      if (event.type === 'NEW_MESSAGE') {
        fetchConversations(); // Refresh list to update unread counts and last message snippet
      }
    });

    return () => {
      sub.unsubscribe();
    };
  }, [isConnected, authUser]);

  const fetchMoreMessages = async () => {
    if (!selectedConversation || !hasMoreMessages) return;
    try {
      const nextPage = messagePage + 1;
      const res = await chatApi.getMessages(selectedConversation.id, nextPage, 30);
      const content = res.content;
      setMessages(prev => [...[...content].reverse(), ...prev]);
      setHasMoreMessages(!res.last);
      setMessagePage(nextPage);
    } catch (error) {
      console.error('Failed to load more messages', error);
    }
  };

  const [isUploading, setIsUploading] = useState(false);

  const handleSendMessage = async (content: string) => {
    if (!selectedConversation) return;
    try {
      const msg = await chatApi.sendTextMessage({ conversationId: selectedConversation.id, content });
      handleMessageReceived(msg);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendImage = async (file: File) => {
    if (!selectedConversation) return;
    try {
      setIsUploading(true);
      // Upload file to Cloudinary via backend
      const url = await chatApi.uploadImage(file);
      // Send message with the returned URL
      const msg = await chatApi.sendImageMessage({ 
        conversationId: selectedConversation.id, 
        url, 
        publicId: 'uploaded', // Mock or extract if backend returns it later
        fileType: file.type, 
        fileSize: file.size 
      });
      handleMessageReceived(msg);
    } catch (e) {
      console.error('Failed to send image', e);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card className="flex h-[calc(100dvh-120px)] w-full overflow-hidden p-0 shadow-sm border-0 bg-white">
      {/* Left Column: Conversation List / User List */}
      <div className="w-[320px] shrink-0 border-r border-slate-200 bg-slate-50 flex flex-col min-h-0">
        <div className="h-16 border-b border-slate-200 p-4 flex items-center justify-between shrink-0">
          <h2 className="text-xl font-semibold text-slate-800">Đoạn chat</h2>
          <button 
            onClick={() => setIsCreatingGroup(!isCreatingGroup)}
            className="p-2 rounded-full hover:bg-slate-200 text-slate-600 transition-colors"
            title={isCreatingGroup ? "Đóng" : "Tạo nhóm mới"}
          >
            {isCreatingGroup ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
              </svg>
            )}
          </button>
        </div>


        <div className="p-3 border-b border-slate-100">
          <input 
            type="text" 
            placeholder="Tìm kiếm đoạn chat hoặc người dùng..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-full bg-slate-100 border-transparent px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:bg-white transition-colors"
          />
        </div>

        <div className="flex-1 overflow-y-auto">
          <ConversationList
            searchQuery={searchQuery}
          />
        </div>
      </div>

      {/* Right Panel: Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        {selectedConversation ? (
          <>
            <ChatHeader 
              onOpenSettings={() => {
                if (selectedConversation.type === 'GROUP') {
                  setIsGroupSettingsOpen(true);
                }
              }} 
            />
            <MessageList onLoadMore={fetchMoreMessages} />
            <MessageInput onSend={handleSendMessage} onSendImage={handleSendImage} isUploading={isUploading} />
          </>
        ) : (
          <EmptyChatState />
        )}
      </div>

      <CreateGroupModal 
        isOpen={isCreatingGroup}
        onClose={() => setIsCreatingGroup(false)}
        onCreate={handleCreateGroup}
      />

      {selectedConversation && selectedConversation.type === 'GROUP' && (
        <GroupSettingsModal 
          isOpen={isGroupSettingsOpen}
          onClose={() => setIsGroupSettingsOpen(false)}
          conversationId={selectedConversation.id}
          onGroupUpdated={async () => {
            fetchConversations();
            try {
              const updated = await chatApi.getConversationDetail(selectedConversation.id);
              setSelectedConversation(updated);
            } catch(e) {}
          }}
          onGroupLeft={() => {
            setSelectedConversation(null);
            fetchConversations();
          }}
        />
      )}
    </Card>
  );
}

export default function ChatPage() {
  return (
    <ChatProvider>
      <ChatContent />
    </ChatProvider>
  );
}
