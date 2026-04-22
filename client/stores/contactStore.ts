import { create } from 'zustand';
import * as Contacts from 'expo-contacts';
import api from '../services/api';
import { Friend } from './friendStore';

interface ContactUser {
  _id: string;
  username: string;
  displayName: string;
  avatar: string;
  phoneNumber: string;
  snapScore: number;
}

interface ContactState {
  suggestedFriends: ContactUser[];
  isSyncing: boolean;
  error: string | null;

  syncContacts: () => Promise<void>;
  updateMyPhoneNumber: (phoneNumber: string) => Promise<void>;
}

export const useContactStore = create<ContactState>((set) => ({
  suggestedFriends: [],
  isSyncing: false,
  error: null,

  syncContacts: async () => {
    try {
      set({ isSyncing: true, error: null });

      const { status } = await Contacts.requestPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Contacts permission denied');
      }

      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.PhoneNumbers],
      });

      if (data.length > 0) {
        // Extract and normalize phone numbers from device contacts
        const phoneNumbers = data
          .flatMap((contact) => contact.phoneNumbers || [])
          .map((phone) => phone.number?.replace(/\D/g, ''))
          .filter((number): number is string => !!number && number.length >= 10);

        // Remove duplicates
        const uniqueNumbers = Array.from(new Set(phoneNumbers));

        // Sync with server
        const res = await api.post('/contacts/sync', { phoneNumbers: uniqueNumbers });
        set({ suggestedFriends: res.data.users, isSyncing: false });
      } else {
        set({ isSyncing: false });
      }
    } catch (err: any) {
      console.error('Contact sync error:', err);
      set({ error: err.message, isSyncing: false });
    }
  },

  updateMyPhoneNumber: async (phoneNumber: string) => {
    try {
      set({ isSyncing: true, error: null });
      await api.put('/contacts/me', { phoneNumber });
      set({ isSyncing: false });
    } catch (err: any) {
      set({ error: err.message, isSyncing: false });
      throw err;
    }
  },
}));
