import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Alert, TextInput, Platform } from 'react-native';
import { useAuthStore } from '../../stores/authStore';
import Avatar from '../../components/Avatar';
import Button from '../../components/Button';
import { COLORS, FONTS, SPACING, RADIUS } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen() {
  const { user, logout, updateProfile, deleteAccount } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState(user?.displayName || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleLogout = () => {
    logout();
  };

  const handleUpdateName = async () => {
    if (!newName.trim() || newName === user?.displayName) {
      setIsEditing(false);
      return;
    }
    
    try {
      setIsSaving(true);
      await updateProfile({ displayName: newName.trim() });
      setIsEditing(false);
    } catch (err: any) {
      Alert.alert('Error', 'Failed to update name: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = () => {
    const confirmDelete = () => {
      deleteAccount().catch(err => Alert.alert('Error', 'Failed to delete account'));
    };

    if (Platform.OS === 'web') {
      if (window.confirm('WARNING: Are you sure you want to delete your account? This action cannot be undone.')) {
        confirmDelete();
      }
    } else {
      Alert.alert(
        'Delete Account',
        'Are you sure you want to delete your account? This will remove all your messages, friends, and data. This action cannot be undone.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete Permanently', style: 'destructive', onPress: confirmDelete }
        ]
      );
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Avatar uri={user?.avatar} displayName={user?.displayName} size={100} />
        
        {isEditing ? (
          <View style={styles.editContainer}>
            <TextInput
              style={styles.nameInput}
              value={newName}
              onChangeText={setNewName}
              placeholder="Display Name"
              placeholderTextColor={COLORS.textMuted}
              autoFocus
            />
            <View style={styles.editButtons}>
              <TouchableOpacity onPress={() => setIsEditing(false)} style={styles.cancelBtn}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleUpdateName} style={styles.saveBtn} disabled={isSaving}>
                <Text style={styles.saveText}>{isSaving ? 'Saving...' : 'Save'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.nameContainer}>
            <Text style={styles.displayName}>{user?.displayName}</Text>
            <TouchableOpacity onPress={() => { setNewName(user?.displayName || ''); setIsEditing(true); }}>
              <Ionicons name="pencil" size={18} color={COLORS.primary} style={styles.editIcon} />
            </TouchableOpacity>
          </View>
        )}
        
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
        <Text style={styles.sectionTitle}>Danger Zone</Text>
        <TouchableOpacity style={[styles.infoCard, { borderColor: COLORS.danger + '44' }]} onPress={handleDeleteAccount}>
          <View style={styles.infoItem}>
            <Ionicons name="trash-outline" size={20} color={COLORS.danger} />
            <Text style={[styles.infoText, { color: COLORS.danger }]}>Delete Account Permanently</Text>
          </View>
        </TouchableOpacity>
      </View>

      <Button
        title="Log Out"
        onPress={handleLogout}
        variant="ghost"
        style={styles.logoutBtn}
        textStyle={{ color: COLORS.textSecondary }}
      />
      
      <Text style={styles.version}>SnapClone v1.1.0</Text>
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
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  displayName: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  editIcon: {
    marginLeft: SPACING.sm,
  },
  editContainer: {
    alignItems: 'center',
    marginTop: SPACING.md,
    width: '100%',
  },
  nameInput: {
    backgroundColor: COLORS.bgInput,
    color: COLORS.textPrimary,
    fontSize: FONTS.sizes.xl,
    fontWeight: 'bold',
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    width: '80%',
    textAlign: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  editButtons: {
    flexDirection: 'row',
    marginTop: SPACING.sm,
  },
  saveBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
    marginLeft: SPACING.sm,
  },
  saveText: {
    color: COLORS.bg,
    fontWeight: 'bold',
  },
  cancelBtn: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
  },
  cancelText: {
    color: COLORS.textSecondary,
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
  logoutBtn: {
    marginTop: SPACING.xl,
    borderColor: COLORS.border,
  },
  version: {
    textAlign: 'center',
    color: COLORS.textMuted,
    fontSize: FONTS.sizes.xs,
    marginTop: 50,
  },
});
