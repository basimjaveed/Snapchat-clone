import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useAuthStore } from '../stores/authStore';
import { useFriendStore } from '../stores/friendStore';
import { useChatStore } from '../stores/chatStore';
import { socketService } from '../services/socket';
import { COLORS } from '../constants/theme';

export default function RootLayout() {
  const { isAuthenticated, isLoading, loadUser, token } = useAuthStore();
  const { setFriendOnline } = useFriendStore();
  const { 
    receiveMessage, 
    setTyping, 
    updateConversationOnline,
    fetchConversations
  } = useChatStore();
  
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)/chat');
    }
  }, [isAuthenticated, isLoading, segments]);

  useEffect(() => {
    if (isAuthenticated && token) {
      const socket = socketService.connect(token);

      socket.on('new_message', ({ message }) => {
        receiveMessage(message);
      });

      socket.on('user_online', ({ userId }) => {
        setFriendOnline(userId, true);
        updateConversationOnline(userId, true);
      });

      socket.on('user_offline', ({ userId, lastSeen }) => {
        setFriendOnline(userId, false, lastSeen);
        updateConversationOnline(userId, false, lastSeen);
      });

      socket.on('user_typing', ({ userId }) => {
        setTyping(userId, true);
      });

      socket.on('user_stop_typing', ({ userId }) => {
        setTyping(userId, false);
      });

      socket.on('friend_request_received', () => {
        // We could fetch pending requests here
      });

      return () => {
        socket.off('new_message');
        socket.off('user_online');
        socket.off('user_offline');
        socket.off('user_typing');
        socket.off('user_stop_typing');
        socket.off('friend_request_received');
      };
    }
  }, [isAuthenticated, token]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: COLORS.bg },
        }}
      >
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="chat/[id]" options={{ presentation: 'card' }} />
      </Stack>
    </GestureHandlerRootView>
  );
}
