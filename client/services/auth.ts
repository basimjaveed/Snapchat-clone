import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import api from './api';

const TOKEN_KEY = 'token';

export interface AuthUser {
  _id: string;
  username: string;
  email: string;
  displayName: string;
  avatar?: string;
}

export const authService = {
  async signup(data: any) {
    const res = await api.post('/auth/signup', data);
    if (res.data.token) {
      await this.saveToken(res.data.token);
    }
    return res.data;
  },

  async login(data: any) {
    const res = await api.post('/auth/login', data);
    if (res.data.token) {
      await this.saveToken(res.data.token);
    }
    return res.data;
  },

  async getMe() {
    const res = await api.get('/auth/me');
    return res.data;
  },

  async logout() {
    await this.removeToken();
  },

  async saveToken(token: string) {
    try {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
      console.log('Token saved successfully on', Platform.OS);
    } catch (error) {
      console.error('Failed to save token on', Platform.OS, ':', error);
    }
  },

  async getToken() {
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      console.log('Token retrieved on', Platform.OS, ':', !!token);
      return token;
    } catch (error) {
      console.error('Failed to get token on', Platform.OS, ':', error);
      return null;
    }
  },

  async removeToken() {
    try {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      console.log('Token removed successfully on', Platform.OS);
    } catch (error) {
      console.error('Failed to remove token on', Platform.OS, ':', error);
    }
  },
};
