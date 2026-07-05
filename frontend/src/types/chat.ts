export interface MemberResponse {
  userId: number;
  username: string;
  fullName: string;
  role: 'OWNER' | 'MEMBER';
  joinedAt: string;
}

export interface Conversation {
  id: number;
  name: string;
  type: "PRIVATE" | "GROUP";
  status: "ACTIVE" | "DELETED";
  avatar?: string;
  unreadCount: number;
  lastMessage?: {
    content: string;
    senderName: string;
    createdAt: string;
  };
  lastMessageAt?: string;
  createdAt: string;
  // Included from ConversationDetailResponse
  members?: MemberResponse[];
  totalMessages?: number;
}

export interface Attachment {
  id: number;
  type: "IMAGE" | "FILE" | "DOCUMENT";
  url: string;
  publicId?: string;
  fileType?: string;
  fileSize?: number;
}

export interface Message {
  id: number;
  conversationId: number;
  senderId?: number;
  senderName?: string;
  messageType: "TEXT" | "IMAGE" | "SYSTEM";
  content: string;
  replyToMessageId?: number;
  replyToContent?: string;
  edited: boolean;
  recalled: boolean;
  attachments?: Attachment[];
  createdAt: string;
  updatedAt?: string;
}

export type ChatEventType = "NEW_MESSAGE" | "MESSAGE_EDITED" | "MESSAGE_RECALLED";

export interface ChatEvent<T> {
  type: ChatEventType;
  conversationId: number;
  userId?: number;
  data: T;
}
