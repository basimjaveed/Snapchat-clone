import React, { useEffect, useState, useRef } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  FlatList, 
  KeyboardAvoidingView, 
  Platform,
  TouchableOpacity,
  TextInput,
  ActivityIndicator
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useChatStore } from '../../stores/chatStore';
import { useAuthStore } from '../../stores/authStore';
import Avatar from '../../components/Avatar';
import MessageBubble from '../../components/MessageBubble';
import TypingIndicator from '../../components/TypingIndicator';
import { COLORS, FONTS, SPACING, RADIUS } from '../../constants/theme';
import { socketService } from '../../services/socket';

export default function ChatDetailScreen() {
  const { id: conversationId } = useLocalSearchParams<{ id: string }>();
  const { 
    activeMessages, 
    fetchMessages, 
    sendMessage, 
    isLoadingMessages,
    setActiveConversation,
    clearMessages,
    typingUsers,
    conversations,
    markRead
  } = useChatStore();
  const { user: me } = useAuthStore();
  const [text, setText] = useState('');
  const flatListRef = useRef<FlatList>(null);
  const router = useRouter();

  // Find the other user from conversations list
  const conversation = conversations.find(c => c.conversationId === conversationId);
  const friend = conversation?.friend;
  const isFriendTyping = friend ? typingUsers[friend._id] : false;

  useEffect(() => {
    setActiveConversation(conversationId);
    fetchMessages(conversationId);
    
    return () => {
      clearMessages();
      setActiveConversation(null);
    };
  }, [conversationId]);

  useEffect(() => {
    if (friend) {
      markRead(conversationId, friend._id);
    }
  }, [activeMessages.length, friend]);

  const handleSend = () => {
    if (!text.trim() || !friend || !me) return;
    sendMessage(friend._id, text.trim(), me._id);
    setText('');
    socketService.emit('stop_typing', { receiverId: friend._id });
  };

  const handleTyping = (value: string) => {
    setText(value);
    if (!friend) return;
    
    if (value.length > 0) {
      socketService.emit('typing', { receiverId: friend._id });
    } else {
      socketService.emit('stop_typing', { receiverId: friend._id });
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <Stack.Screen 
        options={{
          headerShown: true,
          headerStyle: { backgroundColor: COLORS.bg },
          headerTitle: () => (
            <View style={styles.headerTitleContainer}>
              <Avatar uri={friend?.avatar} displayName={friend?.displayName} size={34} isOnline={friend?.isOnline} />
              <View style={styles.headerTextContainer}>
                <Text style={styles.headerName}>{friend?.displayName || 'Chat'}</Text>
                <Text style={styles.headerStatus}>{friend?.isOnline ? 'Online' : 'Offline'}</Text>
              </View>
            </View>
          ),
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="chevron-back" size={28} color={COLORS.primary} />
            </TouchableOpacity>
          ),
        }}
      />

      <View style={styles.messagesContainer}>
        {isLoadingMessages && !activeMessages.length ? (
          <ActivityIndicator color={COLORS.primary} style={styles.messagesLoader} />
        ) : (
          <FlatList
            ref={flatListRef}
            data={activeMessages}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <MessageBubble 
                message={item} 
                isMine={item.sender._id === me?._id} 
              />
            )}
            contentContainerStyle={styles.listContent}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
          />
        )}
        {isFriendTyping && <TypingIndicator />}
      </View>

      <View style={styles.inputArea}>
        <TouchableOpacity style={styles.iconBtn}>
          <Ionicons name="camera" size={24} color={COLORS.textSecondary} />
        </TouchableOpacity>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={handleTyping}
            placeholder="Type a message..."
            placeholderTextColor={COLORS.textMuted}
            multiline
          />
        </View>
        <TouchableOpacity 
          style={[styles.sendBtn, !text.trim() && styles.sendBtnDisabled]} 
          onPress={handleSend}
          disabled={!text.trim()}
        >
          <Ionicons name="send" size={20} color={COLORS.bg} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTextContainer: {
    marginLeft: SPACING.sm,
  },
  headerName: {
    color: COLORS.textPrimary,
    fontSize: FONTS.sizes.md,
    fontWeight: 'bold',
  },
  headerStatus: {
    color: COLORS.textSecondary,
    fontSize: 10,
  },
  backButton: {
    marginLeft: -10,
    marginRight: 10,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesLoader: {
    flex: 1,
    justifyContent: 'center',
  },
  listContent: {
    paddingVertical: SPACING.md,
  },
  inputArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: SPACING.sm,
    backgroundColor: COLORS.bgCard,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  inputContainer: {
    flex: 1,
    backgroundColor: COLORS.bgInput,
    borderRadius: RADIUS.xl,
    marginHorizontal: SPACING.sm,
    maxHeight: 100,
    paddingHorizontal: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  input: {
    color: COLORS.textPrimary,
    fontSize: FONTS.sizes.md,
    paddingVertical: 10,
  },
  iconBtn: {
    padding: 10,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  sendBtnDisabled: {
    opacity: 0.5,
  },
});
