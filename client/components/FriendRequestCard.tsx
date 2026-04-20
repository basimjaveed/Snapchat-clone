import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Avatar from './Avatar';
import { FriendRequest } from '../stores/friendStore';
import { COLORS, FONTS, RADIUS, SPACING } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';

interface FriendRequestCardProps {
  request: FriendRequest;
  onAccept: (requestId: string) => void;
  onReject: (requestId: string) => void;
}

export default function FriendRequestCard({ request, onAccept, onReject }: FriendRequestCardProps) {
  return (
    <View style={styles.card}>
      <Avatar
        uri={request.sender.avatar}
        displayName={request.sender.displayName}
        size={46}
      />
      <View style={styles.info}>
        <Text style={styles.displayName}>{request.sender.displayName}</Text>
        <Text style={styles.username}>@{request.sender.username}</Text>
        <Text style={styles.subtext}>wants to connect</Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity
          onPress={() => onAccept(request._id)}
          style={[styles.actionBtn, styles.acceptBtn]}
        >
          <Ionicons name="checkmark" size={18} color={COLORS.bg} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => onReject(request._id)}
          style={[styles.actionBtn, styles.rejectBtn]}
        >
          <Ionicons name="close" size={18} color={COLORS.textPrimary} />
        </TouchableOpacity>
      </View>
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
    marginTop: 1,
  },
  subtext: {
    color: COLORS.textMuted,
    fontSize: FONTS.sizes.xs,
    marginTop: 2,
  },
  actions: { flexDirection: 'row', gap: SPACING.sm },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptBtn: { backgroundColor: COLORS.primary },
  rejectBtn: { backgroundColor: COLORS.bgElevated, borderWidth: 1, borderColor: COLORS.border },
});
