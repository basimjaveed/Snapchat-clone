import React, { useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator,
  SafeAreaView
} from 'react-native';
import { useRouter } from 'expo-router';
import { useContactStore } from '../../stores/contactStore';
import { useFriendStore } from '../../stores/friendStore';
import Avatar from '../../components/Avatar';
import Button from '../../components/Button';
import { COLORS, FONTS, SPACING, RADIUS } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';

export default function AddFriendsScreen() {
  const router = useRouter();
  const { suggestedFriends, isSyncing, syncContacts } = useContactStore();
  const { sendRequest, friends } = useFriendStore();

  useEffect(() => {
    syncContacts();
  }, []);

  const isAlreadyFriend = (userId: string) => {
    return friends.some(f => f._id === userId);
  };

  const renderContactUser = ({ item }: { item: any }) => (
    <View style={styles.userCard}>
      <Avatar uri={item.avatar} displayName={item.displayName} size={50} />
      <View style={styles.userInfo}>
        <Text style={styles.displayName}>{item.displayName}</Text>
        <Text style={styles.username}>@{item.username}</Text>
        <Text style={styles.score}>Snap Score: {item.snapScore}</Text>
      </View>
      {isAlreadyFriend(item._id) ? (
        <View style={styles.friendBadge}>
          <Text style={styles.friendBadgeText}>Friends</Text>
        </View>
      ) : (
        <TouchableOpacity 
          style={styles.addBtn}
          onPress={() => sendRequest(item._id)}
        >
          <Ionicons name="person-add" size={20} color={COLORS.bg} />
          <Text style={styles.addBtnText}>Add</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={28} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Friends</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.content}>
        <TouchableOpacity 
          style={styles.syncCard}
          onPress={syncContacts}
        >
          <View style={styles.syncIconBg}>
            <Ionicons name="contacts" size={24} color={COLORS.primary} />
          </View>
          <View style={styles.syncTextContent}>
            <Text style={styles.syncTitle}>Sync Contacts</Text>
            <Text style={styles.syncSub}>Find friends from your address book</Text>
          </View>
          {isSyncing ? (
            <ActivityIndicator color={COLORS.primary} />
          ) : (
            <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
          )}
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Quick Add from Contacts</Text>
        
        <FlatList
          data={suggestedFriends}
          keyExtractor={(item) => item._id}
          renderItem={renderContactUser}
          ListEmptyComponent={
            !isSyncing ? (
              <View style={styles.emptyState}>
                <Ionicons name="people-outline" size={64} color={COLORS.border} />
                <Text style={styles.emptyText}>
                  {suggestedFriends.length === 0 
                    ? "No contacts found on Snapchat yet. Invite them!" 
                    : "Everyone is already added!"}
                </Text>
              </View>
            ) : null
          }
          contentContainerStyle={styles.listPadding}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  content: {
    flex: 1,
    padding: SPACING.md,
  },
  syncCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.xl,
  },
  syncIconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,252,0,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  syncTextContent: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  syncTitle: {
    color: COLORS.textPrimary,
    fontSize: FONTS.sizes.md,
    fontWeight: 'bold',
  },
  syncSub: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.xs,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: FONTS.sizes.sm,
    fontWeight: 'bold',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.md,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,252,0,0.05)',
  },
  userInfo: {
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
  },
  score: {
    fontSize: 10,
    color: COLORS.primary,
    marginTop: 2,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
  },
  addBtnText: {
    color: COLORS.bg,
    fontWeight: 'bold',
    fontSize: 12,
    marginLeft: 4,
  },
  friendBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  friendBadgeText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyText: {
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: SPACING.md,
    fontSize: FONTS.sizes.sm,
    lineHeight: 20,
    paddingHorizontal: 40,
  },
  listPadding: {
    paddingBottom: 40,
  }
});
