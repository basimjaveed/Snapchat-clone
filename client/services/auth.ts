import * as SecureStore from 'expo-secure-store';
import api from './api';

export const TOKEN_KEY = 'auth_token';

export interface AuthUser {
  _id: string;
  username: string;
  email: string;
  displayName: string;
  avatar: string;
  isOnline: boolean;
  lastSeen: string;
  createdAt: string;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  user: AuthUser;
}

export const authService = {
  async signup(data: {
    username: string;
    email: string;
    password: string;
    displayName: string;
  }): Promise<AuthResponse> {
    const res = await api.post('/auth/signup', data);
    await SecureStore.setItemAsync(TOKEN_KEY, res.data.token);
    return res.data;
  },

  async login(data: { email: string; password: string }): Promise<AuthResponse> {
    const res = await api.post('/auth/login', data);
    await SecureStore.setItemAsync(TOKEN_KEY, res.data.token);
    return res.data;
  },

  async getMe(): Promise<AuthUser> {
    const res = await api.get('/auth/me');
    return res.data.user;
  },

  async logout(): Promise<void> {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  },

  async getToken(): Promise<string | null> {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  },
};
