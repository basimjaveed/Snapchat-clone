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
  setFriendOnline: (userId: string, isOnline: boolean, lastSeen?: string) => void;
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
    if (!query.trim() || query.trim().length < 2) {
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
      set((state) => ({
        pendingRequests: state.pendingRequests.filter((r) => r._id !== requestId),
        friends: accepted ? [...state.friends, accepted.sender] : state.friends,
      }));
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

  setFriendOnline: (userId, isOnline, lastSeen?) => {
    set((state) => ({
      friends: state.friends.map((f) =>
        String(f._id) === String(userId) ? { ...f, isOnline, lastSeen: lastSeen || f.lastSeen } : f
      ),
    }));
  },
}));
