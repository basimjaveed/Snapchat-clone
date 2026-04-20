import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Avatar from './Avatar';
import Button from './Button';
import { SearchUser } from '../stores/friendStore';
import { COLORS, FONTS, RADIUS, SPACING } from '../constants/theme';

interface UserCardProps {
  user: SearchUser;
  onAddFriend: (userId: string) => void;
}

export default function UserCard({ user, onAddFriend }: UserCardProps) {
  const statusLabel: Record<SearchUser['friendStatus'], string> = {
    none: 'Add',
    friends: 'Friends ✓',
    request_sent: 'Pending',
    request_received: 'Accept',
  };

  const statusVariant: Record<
    SearchUser['friendStatus'],
    'primary' | 'ghost' | 'secondary'
  > = {
    none: 'primary',
    friends: 'ghost',
    request_sent: 'secondary',
    request_received: 'primary',
  };

  return (
    <View style={styles.card}>
      <Avatar
        uri={user.avatar}
        displayName={user.displayName}
        size={46}
        isOnline={user.isOnline}
      />
      <View style={styles.info}>
        <Text style={styles.displayName}>{user.displayName}</Text>
        <Text style={styles.username}>@{user.username}</Text>
      </View>
      <Button
        title={statusLabel[user.friendStatus]}
        variant={statusVariant[user.friendStatus]}
        size="sm"
        onPress={() => onAddFriend(user._id)}
        disabled={user.friendStatus === 'friends' || user.friendStatus === 'request_sent'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  info: { flex: 1, marginLeft: SPACING.md },
  displayName: {
    color: COLORS.textPrimary,
    fontSize: FONTS.sizes.md,
    fontWeight: '600',
  },
  username: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.sm,
    marginTop: 2,
  },
});
