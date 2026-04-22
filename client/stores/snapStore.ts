import { create } from 'zustand';
import api from '../services/api';
import { Friend } from './friendStore';

export interface Snap {
  _id: string;
  sender: Friend;
  receiver: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  duration: number;
  filter?: string;
  isMirrored?: boolean;
  viewed: boolean;
  createdAt: string;
}

interface SnapState {
  receivedSnaps: Snap[];
  isLoadingSnaps: boolean;
  error: string | null;

  fetchReceivedSnaps: () => Promise<void>;
  sendSnap: (data: FormData) => Promise<void>;
  markSnapViewed: (snapId: string) => Promise<void>;
  addReceivedSnap: (snap: Snap) => void;
}

export const useSnapStore = create<SnapState>((set, get) => ({
  receivedSnaps: [],
  isLoadingSnaps: false,
  error: null,

  fetchReceivedSnaps: async () => {
    try {
      set({ isLoadingSnaps: true });
      const res = await api.get('/snaps/received');
      set({ receivedSnaps: res.data.snaps, isLoadingSnaps: false });
    } catch (err: any) {
      set({ error: err.message, isLoadingSnaps: false });
    }
  },

  sendSnap: async (formData) => {
    try {
      await api.post('/snaps/send', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    } catch (err: any) {
      set({ error: err.message });
      throw err;
    }
  },

  markSnapViewed: async (snapId) => {
    try {
      await api.put(`/snaps/${snapId}/view`);
      set((state) => ({
        receivedSnaps: state.receivedSnaps.filter((s) => s._id !== snapId),
      }));
    } catch (err: any) {
      console.error('Failed to mark snap viewed:', err);
    }
  },

  addReceivedSnap: (snap) => {
    set((state) => ({
      receivedSnaps: [snap, ...state.receivedSnaps],
    }));
  },
}));
