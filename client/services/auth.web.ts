import api from './api';

const TOKEN_KEY = 'token';

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
    localStorage.setItem(TOKEN_KEY, token);
  },

  async getToken() {
    return localStorage.getItem(TOKEN_KEY);
  },

  async removeToken() {
    localStorage.removeItem(TOKEN_KEY);
  },
};
