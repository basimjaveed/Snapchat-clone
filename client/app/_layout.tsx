import { useEffect, useRef } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useAuthStore } from '../stores/authStore';
import { useFriendStore } from '../stores/friendStore';
import { useChatStore } from '../stores/chatStore';
import { socketService } from '../services/socket';
import { authService } from '../services/auth';
import { COLORS } from '../constants/theme';

export default function RootLayout() {
  const { isAuthenticated, isLoading, loadUser, token, hasLoadedOnce } = useAuthStore();
  const { setFriendOnline } = useFriendStore();
  const {
    receiveMessage,
    setTyping,
    updateConversationOnline,
    fetchConversations
  } = useChatStore();

  const segments = useSegments();
  const router = useRouter();
  const lastRoute = useRef<string | null>(null);
  const isCheckingAuth = useRef(false);

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const currentRoute = segments.join('/');
    console.log('Routing check:', { isAuthenticated, inAuthGroup, segments, hasLoadedOnce, currentRoute, lastRoute: lastRoute.current });

    // Only redirect if we've completed the initial load check
    if (!hasLoadedOnce) return;

    // Prevent rapid redirects
    if (isCheckingAuth.current) return;

    // Check if user has a token - if yes, they should be considered authenticated
    const checkAuth = async () => {
      isCheckingAuth.current = true;
      const storedToken = await authService.getToken();
      console.log('Stored token check:', !!storedToken);
      
      // Only redirect if the current route doesn't match the expected route
      // AND we're not already on the correct route
      if (!storedToken && !inAuthGroup) {
        const targetRoute = '(auth)/login';
        if (lastRoute.current !== targetRoute) {
          console.log('Redirecting to login (no token)');
          lastRoute.current = targetRoute;
          router.replace('/(auth)/login');
        }
      } else if (storedToken && inAuthGroup) {
        const targetRoute = '(tabs)/chat';
        if (lastRoute.current !== targetRoute) {
          console.log('Redirecting to chat (has token)');
          lastRoute.current = targetRoute;
          router.replace('/(tabs)/chat');
        }
      } else {
        // Update last route to current if no redirect needed
        lastRoute.current = currentRoute;
      }
      
      isCheckingAuth.current = false;
    };

    checkAuth();
  }, [isLoading, segments, hasLoadedOnce]);

  useEffect(() => {
    if (isAuthenticated && token) {
      const { registerForPushNotificationsAsync } = require('../services/notifications');
      registerForPushNotificationsAsync();
      
      const socket = socketService.connect(token);

      socket.on('message_deleted', ({ messageId, conversationId }) => {
        const { removeMessage } = useChatStore.getState();
        removeMessage(messageId, conversationId);
      });

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

      socket.on('new_snap', ({ snap }) => {
        const { addReceivedSnap } = require('../stores/snapStore').useSnapStore.getState();
        addReceivedSnap(snap);
      });

      socket.on('friend_request_received', () => {
        // We could fetch pending requests here
      });
      
      socket.on('conversation_cleared', ({ conversationId }) => {
        const { activeConversationId } = useChatStore.getState();
        // Clear local messages if this conversation is active
        if (activeConversationId === conversationId) {
          useChatStore.setState({ activeMessages: [] });
        }
        // Update the conversation preview in the list
        const { conversations } = useChatStore.getState();
        const updatedConversations = conversations.map(c => 
          c.conversationId === conversationId ? { ...c, lastMessage: null, unreadCount: 0 } : c
        );
        useChatStore.setState({ conversations: updatedConversations });
      });

      return () => {
        socket.off('new_message');
        socket.off('message_deleted');
        socket.off('user_online');
        socket.off('user_offline');
        socket.off('user_typing');
        socket.off('user_stop_typing');
        socket.off('new_snap');
        socket.off('friend_request_received');
        socket.off('conversation_cleared');
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
