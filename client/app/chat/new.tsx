import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useChatStore } from '../../stores/chatStore';
import { COLORS } from '../../constants/theme';

export default function NewChatScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const router = useRouter();
  const { fetchConversations, conversations } = useChatStore();

  useEffect(() => {
    if (!userId) {
      router.back();
      return;
    }

    const initChat = async () => {
      try {
        // In a real app, you'd call an API to create the conversation.
        // For now, we'll try to find it in the list or wait for the server to handle it.
        // The server's sendMessage usually creates a conversation if it doesn't exist.
        // But we want to navigate to a screen.
        
        // Let's check if the conversation was just created or exists
        const conv = conversations.find(c => 
          c.friend?._id === userId
        );

        if (conv) {
          router.replace(`/chat/${conv._id}`);
        } else {
          // If not found, we can still go to chat detail with a 'new' flag
          // But our current chat detail expects a conversation ID.
          // For now, let's just go back and wait for a message to be sent 
          // (or implement a 'create' call)
          router.replace({
            pathname: '/chat/[id]',
            params: { id: `new_${userId}` }
          });
        }
      } catch (err) {
        console.error('Failed to init chat:', err);
        router.back();
      }
    };

    initChat();
  }, [userId]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={COLORS.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
