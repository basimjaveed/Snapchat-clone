import { create } from 'zustand';
import api from '../services/api';
import { socketService } from '../services/socket';

export interface Message {
  _id: string;
  conversationId: string;
  sender: { _id: string; username: string; displayName: string; avatar: string };
  receiver: string;
  text: string;
  mediaUrl?: string;
  mediaId?: string;
  type: string;
  read: boolean;
  readAt: string | null;
  createdAt: string;
}

export interface Conversation {
  _id: string;
  conversationId: string;
  friend: {
    _id: string;
    username: string;
    displayName: string;
    avatar: string;
    isOnline: boolean;
    lastSeen: string;
  };
  lastMessage: Message | null;
  lastMessageAt: string | null;
  unreadCount: number;
}

interface ChatState {
  conversations: Conversation[];
  activeMessages: Message[];
  activeConversationId: string | null;
  typingUsers: Record<string, boolean>;
  isLoadingConversations: boolean;
  isLoadingMessages: boolean;
  hasMoreMessages: boolean;
  nextCursor: string | null;
  error: string | null;

  fetchConversations: () => Promise<void>;
  fetchMessages: (conversationId: string, cursor?: string) => Promise<void>;
  sendMessage: (receiverId: string, text: string, myUserId: string) => Promise<void>;
  receiveMessage: (message: Message) => void;
  setActiveConversation: (conversationId: string | null) => void;
  setTyping: (userId: string, isTyping: boolean) => void;
  markRead: (conversationId: string, senderId: string) => void;
  updateConversationOnline: (userId: string, isOnline: boolean, lastSeen?: string) => void;
  removeMessage: (messageId: string, conversationId: string) => void;
  clearConversation: (conversationId: string) => Promise<void>;
  deleteConversation: (conversationId: string) => Promise<void>;
  clearMessages: () => void;
  updateConversationLastMessage: (message: Message) => void;
  initializeSocket: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  activeMessages: [],
  activeConversationId: null,
  typingUsers: {},
  isLoadingConversations: false,
  isLoadingMessages: false,
  hasMoreMessages: false,
  nextCursor: null,
  error: null,

  fetchConversations: async () => {
    try {
      set({ isLoadingConversations: true });
      const res = await api.get('/chat/conversations');
      set({ conversations: res.data.conversations, isLoadingConversations: false });
    } catch (err: any) {
      set({ error: err.message, isLoadingConversations: false });
    }
  },

  fetchMessages: async (conversationId, cursor?) => {
    try {
      set({ isLoadingMessages: true });
      const params = cursor ? `?cursor=${cursor}` : '';
      const res = await api.get(`/chat/messages/${conversationId}${params}`);
      const { messages, hasMore, nextCursor } = res.data;

      set((state) => ({
        activeMessages: cursor ? [...messages, ...state.activeMessages] : messages,
        hasMoreMessages: hasMore,
        nextCursor,
        isLoadingMessages: false,
        activeConversationId: conversationId,
      }));
    } catch (err: any) {
      set({ error: err.message, isLoadingMessages: false });
    }
  },

  sendMessage: (receiverId, text, myUserId) => {
    return new Promise(async (resolve, reject) => {
      const socket = socketService.getSocket();
      
      // Try Socket first if connected
      if (socket && socket.connected) {
        socketService.emit('send_message', { receiverId, text }, (ack: any) => {
          if (ack?.success) {
            set((state) => ({
              activeMessages: [...state.activeMessages, ack.message],
            }));
            get().updateConversationLastMessage(ack.message);
            resolve(ack.message);
          } else {
            console.warn('Socket send failed, falling back to REST');
            api.post('/chat/messages', { receiverId, text }).then(res => {
               set((state) => ({ activeMessages: [...state.activeMessages, res.data.message] }));
               get().updateConversationLastMessage(res.data.message);
               resolve(res.data.message);
            }).catch(reject);
          }
        });
        return;
      }

      // Fallback to REST API
      try {
        const res = await api.post('/chat/messages', { receiverId, text });
        set((state) => ({ activeMessages: [...state.activeMessages, res.data.message] }));
        get().updateConversationLastMessage(res.data.message);
        resolve(res.data.message);
      } catch (err: any) {
        console.error('REST send failed:', err);
        reject(err);
      }
    });
  },

  receiveMessage: (message) => {
    console.log('📨 Received live message via socket:', message.text, 'for conv:', message.conversationId);
    const { conversations, activeConversationId, fetchConversations } = get();
    const isActive = message.conversationId === activeConversationId;
    console.log('   Is active conversation?', isActive, 'Active ID:', activeConversationId);
    const existingConv = conversations.find(c => c.conversationId === message.conversationId);

    if (!existingConv) {
      console.log('   New conversation detected, refreshing list...');
      fetchConversations();
      return;
    }

    set((state) => ({
      activeMessages: isActive
        ? [...state.activeMessages, message]
        : state.activeMessages,
      conversations: state.conversations.map((c) =>
        c.conversationId === message.conversationId
          ? {
              ...c,
              lastMessage: message,
              lastMessageAt: message.createdAt,
              unreadCount: isActive ? 0 : c.unreadCount + 1,
            }
          : c
      ),
    }));

    // Auto mark-read if this conversation is active
    if (isActive) {
      get().markRead(message.conversationId, message.sender._id);
    }
  },

  setActiveConversation: (conversationId) => {
    set({ activeConversationId: conversationId });
    if (conversationId) {
      set((state) => ({
        conversations: state.conversations.map((c) =>
          c.conversationId === conversationId ? { ...c, unreadCount: 0 } : c
        ),
      }));
    }
  },

  setTyping: (userId, isTyping) => {
    set((state) => ({
      typingUsers: { ...state.typingUsers, [userId]: isTyping },
    }));
  },

  markRead: (conversationId, senderId) => {
    socketService.emit('mark_read', { conversationId, senderId });
  },

  updateConversationLastMessage: (message: Message) => {
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.conversationId === message.conversationId
          ? { ...c, lastMessage: message, lastMessageAt: message.createdAt }
          : c
      ),
    }));
  },

  updateConversationOnline: (userId, isOnline, lastSeen?) => {
    set((state) => ({
      conversations: state.conversations.map((c) =>
        String(c.friend?._id) === String(userId)
          ? { ...c, friend: { ...c.friend, isOnline, lastSeen: lastSeen || c.friend.lastSeen } }
          : c
      ),
    }));
  },

  removeMessage: (messageId, conversationId) => {
    set((state) => ({
      activeMessages: state.activeConversationId === conversationId
        ? state.activeMessages.filter(m => m._id !== messageId)
        : state.activeMessages,
      conversations: state.conversations.map(c => 
        c.conversationId === conversationId && c.lastMessage?._id === messageId
          ? { ...c, lastMessage: null } // Simplified: in reality we'd fetch previous message
          : c
      )
    }));
  },

  clearConversation: async (conversationId) => {
    try {
      await api.delete(`/chat/messages/${conversationId}/clear`);
      set((state) => ({
        activeMessages: state.activeConversationId === conversationId ? [] : state.activeMessages,
        conversations: state.conversations.map(c => 
          c.conversationId === conversationId ? { ...c, lastMessage: null, unreadCount: 0 } : c
        )
      }));
    } catch (err: any) {
      console.error('Failed to clear conversation:', err);
      throw err;
    }
  },

  deleteConversation: async (conversationId) => {
    try {
      await api.delete(`/chat/delete/${conversationId}`);
      set((state) => ({
        conversations: state.conversations.filter(c => c.conversationId !== conversationId)
      }));
    } catch (err: any) {
      console.error('Failed to delete conversation:', err);
      throw err;
    }
  },

  clearMessages: () => set({ activeMessages: [], activeConversationId: null, nextCursor: null, hasMoreMessages: false }),

  initializeSocket: () => {
    const socket = socketService.getSocket();
    if (!socket) return;

    // Listen for new messages
    socket.on('receive_message', (message: Message) => {
      get().receiveMessage(message);
    });

    // Listen for typing status
    socket.on('user_typing', (data: { userId: string, isTyping: boolean }) => {
      get().setTyping(data.userId, data.isTyping);
    });

    // Listen for message read updates
    socket.on('message_read', (data: { conversationId: string, readerId: string }) => {
      set((state) => ({
        activeMessages: state.activeMessages.map(m => 
          m.conversationId === data.conversationId && m.sender._id !== data.readerId
            ? { ...m, read: true, readAt: new Date().toISOString() }
            : m
        )
      }));
    });

    // Listen for deleted messages
    socket.on('message_deleted', ({ messageId, conversationId }: { messageId: string, conversationId: string }) => {
      get().removeMessage(messageId, conversationId);
    });

    // Listen for conversation cleared
    socket.on('conversation_cleared', ({ conversationId }: { conversationId: string }) => {
      if (get().activeConversationId === conversationId) {
        set({ activeMessages: [] });
      }
      set((state) => ({
        conversations: state.conversations.map(c => 
          c.conversationId === conversationId ? { ...c, lastMessage: null, unreadCount: 0 } : c
        )
      }));
    });

    // Listen for online status updates for chat list
    socket.on('user_online', ({ userId }: { userId: string }) => {
      get().updateConversationOnline(userId, true);
    });

    socket.on('user_offline', ({ userId, lastSeen }: { userId: string, lastSeen: string }) => {
      get().updateConversationOnline(userId, false, lastSeen);
    });
  },
}));
