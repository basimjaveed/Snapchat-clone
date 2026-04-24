import { create } from 'zustand';
import api from '../services/api';
import { socketService } from '../services/socket';

export interface Friend {
  _id: string;
  username: string;
  displayName: string;
  avatar: string;
  isOnline: boolean;
  lastSeen: string;
}

export interface FriendRequest {
  _id: string;
  sender: Friend;
  status: string;
  createdAt: string;
}

export interface SearchUser extends Friend {
  email: string;
  friendStatus: 'none' | 'friends' | 'request_sent' | 'request_received';
}

interface FriendState {
  friends: Friend[];
  pendingRequests: FriendRequest[];
  searchResults: SearchUser[];
  isLoading: boolean;
  isSearching: boolean;
  error: string | null;

  fetchFriends: () => Promise<void>;
  fetchPending: () => Promise<void>;
  searchUsers: (query: string) => Promise<void>;
  clearSearch: () => void;
  sendRequest: (receiverId: string) => Promise<void>;
  acceptRequest: (requestId: string) => Promise<void>;
  rejectRequest: (requestId: string) => Promise<void>;
  removeFriend: (friendId: string) => Promise<void>;
  setFriendOnline: (userId: string, isOnline: boolean, lastSeen?: string) => void;
  initializeSocket: () => void;
}

export const useFriendStore = create<FriendState>((set, get) => ({
  friends: [],
  pendingRequests: [],
  searchResults: [],
  isLoading: false,
  isSearching: false,
  error: null,

  fetchFriends: async () => {
    try {
      set({ isLoading: true });
      const res = await api.get('/friends');
      set({ friends: res.data.friends, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  fetchPending: async () => {
    try {
      const res = await api.get('/friends/pending');
      set({ pendingRequests: res.data.requests });
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  searchUsers: async (query) => {
    if (!query.trim()) {
      set({ searchResults: [] });
      return;
    }
    try {
      set({ isSearching: true });
      const res = await api.get(`/users/search?q=${encodeURIComponent(query)}`);
      set({ searchResults: res.data.users, isSearching: false });
    } catch (err: any) {
      set({ error: err.message, isSearching: false });
    }
  },

  clearSearch: () => set({ searchResults: [] }),

  sendRequest: async (receiverId) => {
    try {
      await api.post('/friends/request', { receiverId });
      // Optimistically update search results
      set((state) => ({
        searchResults: state.searchResults.map((u) =>
          u._id === receiverId ? { ...u, friendStatus: 'request_sent' } : u
        ),
      }));
    } catch (err: any) {
      set({ error: err.message });
      throw err;
    }
  },

  acceptRequest: async (requestId) => {
    try {
      await api.put(`/friends/accept/${requestId}`);
      const accepted = get().pendingRequests.find((r) => r._id === requestId);
      if (accepted) {
        set((state) => ({
          pendingRequests: state.pendingRequests.filter((r) => r._id !== requestId),
          friends: [...state.friends, accepted.sender],
          searchResults: state.searchResults.map(u => 
            u._id === accepted.sender._id ? { ...u, friendStatus: 'friends' } : u
          )
        }));
      }
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  rejectRequest: async (requestId) => {
    try {
      await api.put(`/friends/reject/${requestId}`);
      set((state) => ({
        pendingRequests: state.pendingRequests.filter((r) => r._id !== requestId),
      }));
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  removeFriend: async (friendId) => {
    try {
      await api.delete(`/friends/unfriend/${friendId}`);
      set((state) => ({
        friends: state.friends.filter((f) => f._id !== friendId),
        searchResults: state.searchResults.map(u => 
          u._id === friendId ? { ...u, friendStatus: 'none' } : u
        )
      }));
    } catch (err: any) {
      set({ error: err.message });
      throw err;
    }
  },

  setFriendOnline: (userId, isOnline, lastSeen?) => {
    set((state) => ({
      friends: state.friends.map((f) =>
        String(f._id) === String(userId) ? { ...f, isOnline, lastSeen: lastSeen || f.lastSeen } : f
      ),
    }));
  },

  initializeSocket: () => {
    const socket = socketService.getSocket();
    if (!socket) return;

    // Listen for new friend requests
    socket.on('friend_request_received', (data: { from: Friend }) => {
      console.log('📬 New friend request received from:', data.from.username);
      set((state) => ({
        pendingRequests: [{
          _id: Math.random().toString(), // Temp ID until refresh
          sender: data.from,
          status: 'pending',
          createdAt: new Date().toISOString()
        }, ...state.pendingRequests]
      }));
    });

    // Listen for accepted requests
    socket.on('friend_request_accepted', (data: { by: Friend }) => {
      console.log('✅ Friend request accepted by:', data.by.username);
      set((state) => ({
        friends: [data.by, ...state.friends],
        searchResults: state.searchResults.map(u => 
          u._id === data.by._id ? { ...u, friendStatus: 'friends' } : u
        )
      }));
    });

    // Listen for online status updates
    socket.on('user_online', (data: { userId: string, lastSeen?: string }) => {
      get().setFriendOnline(data.userId, true, data.lastSeen);
    });

    socket.on('user_offline', (data: { userId: string, lastSeen: string }) => {
      get().setFriendOnline(data.userId, false, data.lastSeen);
    });
  },
}));
