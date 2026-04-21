import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Avatar from './Avatar';
import { SearchUser } from '../stores/friendStore';
import { COLORS, FONTS, SPACING } from '../constants/theme';

interface UserCardProps {
  user: SearchUser;
  onAddFriend: (userId: string) => void;
  onChat?: () => void;
}

export default function UserCard({ user, onAddFriend, onChat }: UserCardProps) {
  const isFriend = user.friendStatus === 'friends';
  const isPending = user.friendStatus === 'request_received';
  const isSent = user.friendStatus === 'request_sent';

  return (
    <View style={styles.container}>
      <Avatar
        uri={user.avatar}
        displayName={user.displayName}
        size={50}
        isOnline={user.isOnline}
      />
      <View style={styles.info}>
        <Text style={styles.displayName}>{user.displayName}</Text>
        <Text style={styles.username}>@{user.username}</Text>
      </View>
      
      {isFriend ? (
        <TouchableOpacity style={styles.chatButton} onPress={onChat}>
          <Ionicons name="chatbubble-outline" size={20} color={COLORS.primary} />
          <Text style={styles.chatButtonText}>Chat</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity 
          style={[styles.addButton, (isPending || isSent) && styles.pendingButton]} 
          onPress={() => onAddFriend(user._id)}
          disabled={isSent}
        >
          <Ionicons 
            name={isPending ? "person-add" : isSent ? "time-outline" : "person-add-outline"} 
            size={18} 
            color={isPending || isSent ? COLORS.textSecondary : COLORS.bg} 
          />
          <Text style={[styles.addButtonText, (isPending || isSent) && styles.pendingText]}>
            {isPending ? 'Accept' : isSent ? 'Pending' : 'Add'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  info: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  displayName: {
    fontSize: FONTS.sizes.md,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  username: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
  },
  addButtonText: {
    color: COLORS.bg,
    fontWeight: 'bold',
    fontSize: FONTS.sizes.sm,
    marginLeft: 4,
  },
  pendingButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  pendingText: {
    color: COLORS.textSecondary,
  },
  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  chatButtonText: {
    color: COLORS.primary,
    fontWeight: 'bold',
    fontSize: FONTS.sizes.sm,
    marginLeft: 4,
  },
});
