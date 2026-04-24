import { create } from 'zustand';
import { authService, AuthUser } from '../services/auth';
import { socketService } from '../services/socket';

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  hasLoadedOnce: boolean; // Track if we've attempted to load the user at least once

  signup: (data: { username: string; email: string; password: string; displayName: string }) => Promise<void>;
  login: (data: { email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
  updateProfile: (data: { displayName?: string; avatar?: string }) => Promise<void>;
  deleteAccount: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  hasLoadedOnce: false,

  signup: async (data) => {
    try {
      set({ isLoading: true, error: null });
      const res = await authService.signup(data);
      socketService.connect(res.token);
      set({ user: res.user, token: res.token, isAuthenticated: true, isLoading: false });
    } catch (err: any) {
      set({ isLoading: false, error: err.message });
      throw err;
    }
  },

  login: async (data) => {
    try {
      set({ isLoading: true, error: null });
      const res = await authService.login(data);
      socketService.connect(res.token);
      set({ user: res.user, token: res.token, isAuthenticated: true, isLoading: false });
    } catch (err: any) {
      set({ isLoading: false, error: err.message });
      throw err;
    }
  },

  logout: async () => {
    await authService.logout();
    socketService.disconnect();
    set({ user: null, token: null, isAuthenticated: false });
  },

  loadUser: async () => {
    try {
      set({ isLoading: true });
      const token = await authService.getToken();
      console.log('loadUser: token exists?', !!token);

      if (!token) {
        set({ isLoading: false, isAuthenticated: false, hasLoadedOnce: true });
        return;
      }

      // Set authenticated state immediately if token exists
      set({ token, isAuthenticated: true });

      const res = await authService.getMe();
      console.log('loadUser: user data loaded', res.user?.username);
      socketService.connect(token);
      set({ user: res.user, token, isAuthenticated: true, isLoading: false, hasLoadedOnce: true });
    } catch (err) {
      console.error('loadUser error:', err);
      // If API call fails but we have a token, keep the user authenticated
      // This prevents logout on network issues
      const token = await authService.getToken();
      if (token) {
        set({ token, isAuthenticated: true, isLoading: false, hasLoadedOnce: true });
      } else {
        await authService.logout();
        set({ user: null, token: null, isAuthenticated: false, isLoading: false, hasLoadedOnce: true });
      }
    }
  },

  updateProfile: async (data) => {
    try {
      const api = require('../services/api').default;
      const res = await api.put('/users/profile', data);
      set({ user: res.data.user });
    } catch (err: any) {
      set({ error: err.message });
      throw err;
    }
  },

  deleteAccount: async () => {
    try {
      const api = require('../services/api').default;
      await api.delete('/users/me');
      await get().logout();
    } catch (err: any) {
      set({ error: err.message });
      throw err;
    }
  },

  clearError: () => set({ error: null }),
}));
