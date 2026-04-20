import React, { useEffect, useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  FlatList, 
  RefreshControl,
  ActivityIndicator
} from 'react-native';
import { useFriendStore } from '../../stores/friendStore';
import Input from '../../components/Input';
import UserCard from '../../components/UserCard';
import FriendRequestCard from '../../components/FriendRequestCard';
import { COLORS, FONTS, SPACING } from '../../constants/theme';

export default function FriendsScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const { 
    friends, 
    pendingRequests, 
    searchResults, 
    isLoading, 
    isSearching,
    fetchFriends, 
    fetchPending, 
    searchUsers,
    clearSearch,
    sendRequest,
    acceptRequest,
    rejectRequest
  } = useFriendStore();

  useEffect(() => {
    fetchFriends();
    fetchPending();
  }, []);

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    if (text.length >= 2) {
      searchUsers(text);
    } else {
      clearSearch();
    }
  };

  const onRefresh = async () => {
    await Promise.all([fetchFriends(), fetchPending()]);
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <Input
        placeholder="Search for friends..."
        value={searchQuery}
        onChangeText={handleSearch}
        leftIcon="search-outline"
        containerStyle={styles.searchBar}
      />

      {isSearching && (
        <ActivityIndicator color={COLORS.primary} style={styles.loader} />
      )}

      {searchResults.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>People</Text>
          {searchResults.map((user) => (
            <UserCard 
              key={user._id} 
              user={user} 
              onAddFriend={() => sendRequest(user._id)} 
            />
          ))}
        </View>
      )}

      {pendingRequests.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Added Me</Text>
          {pendingRequests.map((request) => (
            <FriendRequestCard
              key={request._id}
              request={request}
              onAccept={() => acceptRequest(request._id)}
              onReject={() => rejectRequest(request._id)}
            />
          ))}
        </View>
      )}

      {friends.length > 0 && (
        <Text style={styles.sectionTitle}>My Friends ({friends.length})</Text>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={friends}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <UserCard 
            user={{ ...item, friendStatus: 'friends' } as any} 
            onAddFriend={() => {}} 
          />
        )}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          !isLoading && friends.length === 0 && searchResults.length === 0 && pendingRequests.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Find your friends to start snapping!</Text>
            </View>
          ) : null
        }
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl 
            refreshing={isLoading} 
            onRefresh={onRefresh} 
            tintColor={COLORS.primary} 
          />
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
    padding: SPACING.md,
  },
  header: {
    marginBottom: SPACING.md,
  },
  searchBar: {
    marginBottom: SPACING.lg,
  },
  loader: {
    marginBottom: SPACING.md,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: FONTS.sizes.sm,
    fontWeight: 'bold',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.md,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 50,
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: FONTS.sizes.md,
    textAlign: 'center',
  },
});
