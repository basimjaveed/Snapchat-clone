import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useAuthStore } from '../stores/authStore';
import { useFriendStore } from '../stores/friendStore';
import { useChatStore } from '../stores/chatStore';
import { socketService } from '../services/socket';
import { COLORS } from '../constants/theme';

export default function RootLayout() {
  const { isAuthenticated, isLoading, loadUser, token, hasLoadedOnce } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  // 1. Initial User Load
  useEffect(() => {
    loadUser();
  }, []);

  // 2. Navigation Guard
  useEffect(() => {
    if (isLoading || !hasLoadedOnce) return;

    const inAuthGroup = segments[0] === '(auth)';
    
    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)/chat');
    }
  }, [isLoading, segments, hasLoadedOnce, isAuthenticated]);

  // 3. Real-Time Services Initialization
  useEffect(() => {
    if (isAuthenticated && token) {
      // Connect Socket
      socketService.connect(token);
      
      // Initialize Store Listeners
      useFriendStore.getState().initializeSocket();
      useChatStore.getState().initializeSocket();
      
      // Load Initial Data
      useFriendStore.getState().fetchPending();
      useChatStore.getState().fetchConversations();
      useFriendStore.getState().fetchFriends();

      // Setup Push Notifications
      const { registerForPushNotificationsAsync } = require('../services/notifications');
      registerForPushNotificationsAsync();

      return () => {
        socketService.disconnect();
      };
    }
  }, [isAuthenticated, token]);

  if (isLoading && !hasLoadedOnce) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

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
