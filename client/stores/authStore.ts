import { create } from 'zustand';
import { authService, AuthUser } from '../services/auth';
import { socketService } from '../services/socket';

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  signup: (data: { username: string; email: string; password: string; displayName: string }) => Promise<void>;
  login: (data: { email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

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
      if (!token) {
        set({ isLoading: false, isAuthenticated: false });
        return;
      }
      const user = await authService.getMe();
      socketService.connect(token);
      set({ user, token, isAuthenticated: true, isLoading: false });
    } catch {
      await authService.logout();
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
