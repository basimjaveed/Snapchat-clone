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
import { useSnapStore } from '../../stores/snapStore';
import Avatar from '../../components/Avatar';
import { COLORS, FONTS, SPACING, RADIUS } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';

export default function ChatScreen() {
  const { conversations, fetchConversations, isLoadingConversations } = useChatStore();
  const { receivedSnaps, fetchReceivedSnaps, isLoadingSnaps } = useSnapStore();
  const router = useRouter();

  useEffect(() => {
    fetchConversations();
    fetchReceivedSnaps();
  }, []);

  const onRefresh = () => {
    fetchConversations();
    fetchReceivedSnaps();
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

  const renderConversation = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.conversationItem}
      onPress={() => router.push(`/chat/${item.conversationId}`)}
    >
      <Avatar 
        uri={item.friend.avatar} 
        displayName={item.friend.displayName} 
        isOnline={item.friend.isOnline}
        size={50}
      />
      <View style={styles.convInfo}>
        <View style={styles.convHeader}>
          <Text style={styles.friendName}>{item.friend.displayName}</Text>
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
    </TouchableOpacity>
  );

  const renderSnapsHeader = () => {
    if (receivedSnaps.length === 0) return null;

    return (
      <View style={styles.snapsSection}>
        <Text style={styles.sectionTitle}>New Snaps</Text>
        <FlatList
          horizontal
          data={receivedSnaps}
          keyExtractor={(item) => item._id}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.snapItem}
              onPress={() => router.push(`/snap/view?id=${item._id}`)}
            >
              <View style={styles.snapAvatarWrapper}>
                <Avatar uri={item.sender.avatar} displayName={item.sender.displayName} size={60} />
                <View style={styles.snapBadge}>
                  <Ionicons name="flash" size={12} color={COLORS.bg} />
                </View>
              </View>
              <Text style={styles.snapSenderName} numberOfLines={1}>{item.sender.displayName}</Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.snapsScrollContent}
        />
        <View style={styles.divider} />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={conversations}
        keyExtractor={(item) => item._id}
        renderItem={renderConversation}
        ListHeaderComponent={renderSnapsHeader}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl 
            refreshing={isLoadingConversations || isLoadingSnaps} 
            onRefresh={onRefresh} 
            tintColor={COLORS.primary}
          />
        }
        ListEmptyComponent={
          !isLoadingConversations && conversations.length === 0 && receivedSnaps.length === 0 ? (
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
  snapsSection: {
    paddingTop: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONTS.sizes.sm,
    fontWeight: 'bold',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },
  snapsScrollContent: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
  },
  snapItem: {
    alignItems: 'center',
    marginRight: SPACING.lg,
    width: 70,
  },
  snapAvatarWrapper: {
    position: 'relative',
    padding: 3,
    borderRadius: 35,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  snapBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.primary,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.bg,
  },
  snapSenderName: {
    color: COLORS.textPrimary,
    fontSize: 12,
    marginTop: 6,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: SPACING.md,
    marginVertical: SPACING.sm,
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
  emptyContainer: {
    alignItems: 'center',
    marginTop: 50,
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: FONTS.sizes.md,
  },
});
