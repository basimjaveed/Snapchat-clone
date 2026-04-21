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
  ActivityIndicator,
  Alert,
  Modal
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useChatStore } from '../../stores/chatStore';
import { useAuthStore } from '../../stores/authStore';
import { useFriendStore } from '../../stores/friendStore';
import Avatar from '../../components/Avatar';
import MessageBubble from '../../components/MessageBubble';
import TypingIndicator from '../../components/TypingIndicator';
import { COLORS, FONTS, SPACING, RADIUS } from '../../constants/theme';
import { socketService } from '../../services/socket';
import api from '../../services/api';

export default function ChatDetailScreen() {
  const { id: conversationId } = useLocalSearchParams<{ id: string }>();
  const isNewChat = conversationId?.startsWith('new_');
  const targetUserId = isNewChat ? conversationId?.replace('new_', '') : null;

  const { 
    activeMessages, 
    fetchMessages, 
    sendMessage, 
    isLoadingMessages,
    setActiveConversation,
    clearMessages,
    typingUsers,
    conversations,
    markRead,
    fetchConversations,
    clearConversation
  } = useChatStore();
  const { friends } = useFriendStore();
  const { user: me } = useAuthStore();
  const [text, setText] = useState('');
  const flatListRef = useRef<FlatList>(null);
  const router = useRouter();

  // Find the other user from conversations list OR from friends list if new
  const conversation = conversations.find(c => c._id === conversationId);
  
  // If we can't find the friend in the conversation object, 
  // let's try to find them in our friends list using the ID from the URL if possible
  let friend = isNewChat 
    ? friends.find(f => f._id === targetUserId)
    : conversation?.friend;

  // Final fallback: if friend is still missing, try matching against part of the ID 
  // (common in concatenated ID systems)
  if (!friend && conversationId && me) {
    const ids = conversationId.split('_');
    const otherId = ids.find(id => id !== me._id);
    if (otherId) {
      friend = friends.find(f => f._id === otherId);
    }
  }

  const [tempFriend, setTempFriend] = useState<any>(null);
  
  // Create a live 'activeFriend' that picks up store updates
  const activeFriend = (() => {
    // 1. Check if they are a regular friend
    const storeFriend = friends.find(f => String(f._id) === String(targetUserId || (conversation?.friend?._id)));
    if (storeFriend) return storeFriend;

    // 2. Check if the conversation object in the store has the updated info
    if (conversation?.friend) return conversation.friend;

    // 3. Fallback to the temp info we fetched
    return tempFriend;
  })();

  useEffect(() => {
    // If we have an ID but no name, we definitely need to fetch
    const needsFetch = activeFriend ? !activeFriend.displayName : !!conversationId;

    if (needsFetch && conversationId && me) {
      const ids = conversationId.split('_');
      const otherId = ids.find(id => id !== me._id);
      
      if (otherId && (!activeFriend || !activeFriend.displayName)) {
        console.log('Fetching missing friend info for:', otherId);
        api.get(`/users/${otherId}`).then(res => {
          setTempFriend(res.data.user);
        }).catch(err => console.error('Failed to fetch temp friend:', err));
      }
    }
  }, [conversationId, activeFriend?.displayName, me?._id]);

  const isFriendTyping = activeFriend ? typingUsers[activeFriend._id] : false;

  useEffect(() => {
    if (!isNewChat && conversationId) {
      setActiveConversation(conversationId);
      fetchMessages(conversationId);
    }
    
    return () => {
      clearMessages();
      setActiveConversation(null);
    };
  }, [conversationId, isNewChat]);

  useEffect(() => {
    if (friend && !isNewChat && conversationId) {
      markRead(conversationId, friend._id);
    }
  }, [activeMessages.length, friend, isNewChat, conversationId]);

  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    if (!text.trim() || isSending) return;
    if (!activeFriend || !me) {
      console.error('Cannot send: activeFriend or me is missing', { activeFriend, me });
      alert('Cannot send: Friend information missing. Try going back and re-opening the chat.');
      return;
    }
    
    try {
      setIsSending(true);
      const messageText = text.trim();
      setText('');
      
      await sendMessage(activeFriend._id, messageText, me._id);
      socketService.emit('stop_typing', { receiverId: activeFriend._id });
    } catch (err: any) {
      alert('Failed to send: ' + err.message);
      setText(messageText); // Restore text on failure
    } finally {
      setIsSending(false);
    }
  };

  const handleClear = () => {
    if (!conversationId) return;

    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Are you sure you want to delete all messages in this chat?');
      if (confirmed) {
        clearConversation(conversationId as string).catch(() => {
          alert('Failed to clear conversation');
        });
      }
    } else {
      Alert.alert(
        'Clear Conversation',
        'Are you sure you want to delete all messages in this chat?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Clear', 
            style: 'destructive',
            onPress: async () => {
              try {
                await clearConversation(conversationId as string);
              } catch (err: any) {
                Alert.alert('Error', 'Failed to clear conversation');
              }
            }
          },
        ]
      );
    }
  };

  const handleTyping = (value: string) => {
    setText(value);
    if (!activeFriend) return;
    
    if (value.length > 0) {
      socketService.emit('typing', { receiverId: activeFriend._id });
    } else {
      socketService.emit('stop_typing', { receiverId: activeFriend._id });
    }
  };

  const handleKeyPress = (e: any) => {
    if (Platform.OS === 'web') {
      if (e.nativeEvent.key === 'Enter' && !e.nativeEvent.shiftKey) {
        e.preventDefault();
        handleSend();
      }
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
              <Avatar uri={activeFriend?.avatar} displayName={activeFriend?.displayName} size={34} isOnline={activeFriend?.isOnline} />
              <View style={styles.headerTextContainer}>
                <Text style={styles.headerName}>{activeFriend?.displayName || 'Chat'}</Text>
                <Text style={styles.headerStatus}>{activeFriend?.isOnline ? 'Online' : 'Offline'}</Text>
              </View>
            </View>
          ),
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.push('/(tabs)/friends')} style={styles.backButton}>
              <Ionicons name="chevron-back" size={28} color={COLORS.primary} />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <View style={styles.headerRight}>
              <TouchableOpacity onPress={handleClear} style={styles.headerIconBtn}>
                <Ionicons name="trash-outline" size={22} color={COLORS.error || '#ff4444'} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push('/snap')} style={styles.headerIconBtn}>
                <Ionicons name="camera-outline" size={24} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
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
                isMine={String(item.sender?._id || item.sender) === String(me?._id)} 
                onPress={() => {
                  if (item.type === 'snap' && item.mediaId) {
                    router.push({
                      pathname: '/snap/view',
                      params: { id: item.mediaId }
                    });
                  }
                }}
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
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/camera')}>
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
            onKeyPress={handleKeyPress}
            blurOnSubmit={false}
          />
        </View>
        <TouchableOpacity 
          style={[styles.sendBtn, (!text.trim() || isSending) && styles.sendBtnDisabled]} 
          onPress={handleSend}
          disabled={!text.trim() || isSending}
        >
          {isSending ? (
            <ActivityIndicator size="small" color={COLORS.bg} />
          ) : (
            <Ionicons name="send" size={20} color={COLORS.bg} />
          )}
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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  headerIconBtn: {
    padding: SPACING.xs,
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
    padding: 10,
    marginLeft: -10,
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
