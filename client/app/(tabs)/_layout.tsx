import { Platform, View, Text, StyleSheet } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/theme';
import { useChatStore } from '../../stores/chatStore';
import { useFriendStore } from '../../stores/friendStore';

const styles = StyleSheet.create({
  webBadge: {
    position: 'absolute',
    right: -6,
    top: -3,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  webBadgeText: {
    color: COLORS.bg,
    fontSize: 10,
    fontWeight: 'bold',
  },
});

export default function TabsLayout() {
  const router = useRouter();
  const { conversations } = useChatStore();
  const { pendingRequests, fetchPending } = useFriendStore();
  
  // Count conversations that have at least one unread message
  const unreadCount = conversations.filter(c => c.unreadCount > 0).length;
  
  // Count pending friend requests
  const friendsBadgeCount = pendingRequests.length;

  require('react').useEffect(() => {
    fetchPending();
  }, []);

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: COLORS.bg,
          borderBottomWidth: 1,
          borderBottomColor: COLORS.border,
        },
        headerTitleStyle: {
          color: COLORS.textPrimary,
          fontWeight: 'bold',
        },
        tabBarStyle: {
          backgroundColor: COLORS.bg,
          borderTopWidth: 1,
          borderTopColor: COLORS.border,
          height: 60,
          paddingBottom: 10,
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        headerRight: () => (
          <Ionicons 
            name="person-add" 
            size={24} 
            color={COLORS.textPrimary} 
            style={{ marginRight: 15 }}
            onPress={() => router.push('/friends/add')}
          />
        ),
      }}
    >
      <Tabs.Screen
        name="friends"
        options={{
          title: 'Friends',
          tabBarLabel: 'Friends',
          tabBarBadge: friendsBadgeCount > 0 ? friendsBadgeCount : undefined,
          tabBarIcon: ({ color, size }) => (
            <View>
              <Ionicons name="people" size={size} color={color} />
              {Platform.OS === 'web' && friendsBadgeCount > 0 && (
                <View style={styles.webBadge}>
                  <Text style={styles.webBadgeText}>{friendsBadgeCount}</Text>
                </View>
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="camera"
        options={{
          title: 'Camera',
          tabBarLabel: 'Camera',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="camera" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chat',
          tabBarLabel: 'Chat',
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
          tabBarIcon: ({ color, size }) => (
            <View>
              <Ionicons name="chatbubble-ellipses" size={size} color={color} />
              {Platform.OS === 'web' && unreadCount > 0 && (
                <View style={styles.webBadge}>
                  <Text style={styles.webBadgeText}>{unreadCount}</Text>
                </View>
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
