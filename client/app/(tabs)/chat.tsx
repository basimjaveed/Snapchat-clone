import React, { useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity,
  RefreshControl 
} from 'react-native';
import { useRouter } from 'expo-router';
import { useChatStore } from '../../stores/chatStore';
import Avatar from '../../components/Avatar';
import { COLORS, FONTS, SPACING, RADIUS } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';

export default function ChatScreen() {
  const { conversations, fetchConversations, isLoadingConversations } = useChatStore();
  const router = useRouter();

  useEffect(() => {
    fetchConversations();
  }, []);

  const onRefresh = () => {
    fetchConversations();
  };

  const getStreakIcon = (streak: any) => {
    if (!streak || streak.count < 1) return null; // Showing streak even from 1 as per user's "keeps changing"
    
    const now = new Date();
    const lastAt = new Date(streak.lastSnapAt);
    const hoursSinceLast = (now.getTime() - lastAt.getTime()) / (1000 * 60 * 60);

    // If streak is over 48h, it's technically expired (but backend handles reset)
    if (hoursSinceLast > 48) return null;

    // Show timer if less than 4 hours remains in the 24h window
    if (hoursSinceLast > 20 && hoursSinceLast <= 24) {
      return { icon: 'hourglass-outline', color: '#FFFC00', count: streak.count };
    }

    // Show fire if streak is active (at least 1 day/2 snaps)
    return { icon: 'flame', color: '#FF9500', count: streak.count };
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const renderConversation = ({ item }: { item: any }) => {
    const streakInfo = getStreakIcon(item.streak);

    return (
      <TouchableOpacity 
        style={styles.conversationItem}
        onPress={() => router.push(`/chat/${item.conversationId}`)}
      >
        <Avatar 
          uri={item.friend.avatar} 
          displayName={item.friend.displayName} 
          username={item.friend.username}
          isOnline={item.friend.isOnline}
          size={50}
        />
        <View style={styles.convInfo}>
          <View style={styles.convHeader}>
            <View style={styles.nameRow}>
              <Text style={styles.friendName}>{item.friend.displayName}</Text>
              {streakInfo && (
                <View style={styles.streakContainer}>
                  <Text style={styles.streakCount}>{streakInfo.count}</Text>
                  <Ionicons name={streakInfo.icon as any} size={14} color={streakInfo.color} />
                </View>
              )}
            </View>
            {item.lastMessageAt && (
              <Text style={styles.time}>{formatTime(item.lastMessageAt)}</Text>
            )}
          </View>
          <Text 
            style={[styles.lastMessage, item.unreadCount > 0 && styles.unreadText]}
            numberOfLines={1}
          >
            {item.lastMessage?.text || 'Start a conversation'}
          </Text>
        </View>
        {item.unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{item.unreadCount}</Text>
          </View>
        )}
        <TouchableOpacity 
          style={styles.deleteBtn} 
          onPress={() => {
            const confirmDelete = () => {
              useChatStore.getState().deleteConversation(item.conversationId).catch(() => {
                alert('Failed to delete conversation');
              });
            };

            if (require('react-native').Platform.OS === 'web') {
              if (window.confirm('Delete this conversation?')) confirmDelete();
            } else {
              require('react-native').Alert.alert(
                'Delete Chat',
                'Are you sure you want to delete this conversation?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Delete', style: 'destructive', onPress: confirmDelete }
                ]
              );
            }
          }}
        >
          <Ionicons name="trash-outline" size={18} color={COLORS.textMuted} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };


  return (
    <View style={styles.container}>
      <FlatList
        data={conversations}
        keyExtractor={(item) => item._id}
        renderItem={renderConversation}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl 
            refreshing={isLoadingConversations} 
            onRefresh={onRefresh} 
            tintColor={COLORS.primary}
          />
        }
        ListEmptyComponent={
          !isLoadingConversations && conversations.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No messages yet. Say hi to a friend!</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  listContent: {
    paddingBottom: 20,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,252,0,0.05)',
  },
  convInfo: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  convHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: SPACING.xs,
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  streakCount: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
    marginRight: 2,
  },
  friendName: {
    fontSize: FONTS.sizes.md,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  time: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textMuted,
  },
  lastMessage: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
  },
  unreadText: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  badge: {
    backgroundColor: COLORS.primary,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    marginLeft: SPACING.sm,
  },
  badgeText: {
    color: COLORS.bg,
    fontSize: 10,
    fontWeight: 'bold',
  },
  deleteBtn: {
    padding: SPACING.sm,
    marginLeft: SPACING.xs,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 50,
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: FONTS.sizes.md,
  },
});
