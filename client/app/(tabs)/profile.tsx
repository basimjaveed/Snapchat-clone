import React from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useAuthStore } from '../../stores/authStore';
import Avatar from '../../components/Avatar';
import Button from '../../components/Button';
import { COLORS, FONTS, SPACING, RADIUS } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Avatar uri={user?.avatar} displayName={user?.displayName} size={100} />
        <Text style={styles.displayName}>{user?.displayName}</Text>
        <Text style={styles.username}>@{user?.username}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account Info</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoItem}>
            <Ionicons name="mail-outline" size={20} color={COLORS.textSecondary} />
            <Text style={styles.infoText}>{user?.email}</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="calendar-outline" size={20} color={COLORS.textSecondary} />
            <Text style={styles.infoText}>Joined {user ? new Date(user.createdAt).toLocaleDateString() : ''}</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>App Preferences</Text>
        <TouchableOpacity style={styles.prefItem}>
          <View style={styles.prefLeft}>
            <Ionicons name="moon-outline" size={20} color={COLORS.primary} />
            <Text style={styles.prefText}>Dark Mode</Text>
          </View>
          <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.prefItem}>
          <View style={styles.prefLeft}>
            <Ionicons name="notifications-outline" size={20} color={COLORS.textSecondary} />
            <Text style={styles.prefText}>Notifications</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
        </TouchableOpacity>
      </View>

      <Button
        title="Log Out"
        onPress={handleLogout}
        variant="ghost"
        style={styles.logoutBtn}
        textStyle={{ color: COLORS.danger }}
      />
      
      <Text style={styles.version}>SnapClone v1.0.0 (Phase 1+2)</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  content: {
    padding: SPACING.xl,
    paddingBottom: 50,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xxl,
  },
  displayName: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginTop: SPACING.md,
  },
  username: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  section: {
    marginBottom: SPACING.xxl,
  },
  sectionTitle: {
    fontSize: FONTS.sizes.sm,
    fontWeight: 'bold',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.md,
  },
  infoCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  infoText: {
    color: COLORS.textPrimary,
    fontSize: FONTS.sizes.md,
    marginLeft: SPACING.md,
  },
  prefItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  prefLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  prefText: {
    color: COLORS.textPrimary,
    fontSize: FONTS.sizes.md,
    marginLeft: SPACING.md,
  },
  logoutBtn: {
    marginTop: SPACING.xl,
    borderColor: COLORS.danger + '22',
  },
  version: {
    textAlign: 'center',
    color: COLORS.textMuted,
    fontSize: FONTS.sizes.xs,
    marginTop: 50,
  },
});
