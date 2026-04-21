import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  Image, 
  TouchableOpacity, 
  SafeAreaView, 
  FlatList,
  Modal,
  ActivityIndicator
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFriendStore } from '../../stores/friendStore';
import { useSnapStore } from '../../stores/snapStore';
import Avatar from '../../components/Avatar';
import Button from '../../components/Button';
import { COLORS, FONTS, SPACING, RADIUS } from '../../constants/theme';

export default function SnapPreview() {
  const { uri, type } = useLocalSearchParams<{ uri: string, type: string }>();
  const [duration, setDuration] = useState(5);
  const [isPickerVisible, setIsPickerVisible] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  const { friends, fetchFriends } = useFriendStore();
  const { sendSnap } = useSnapStore();
  const router = useRouter();

  useEffect(() => {
    fetchFriends();
  }, []);

  const handleSend = async () => {
    if (!selectedFriend || !uri) return;

    try {
      setIsSending(true);
      const formData = new FormData();
      
      if (uri.startsWith('data:')) {
        // Web: Conver Base64 data URI to Blob
        const parts = uri.split(';base64,');
        const contentType = parts[0].split(':')[1];
        const raw = window.atob(parts[1]);
        const rawLength = raw.length;
        const uInt8Array = new Uint8Array(rawLength);

        for (let i = 0; i < rawLength; ++i) {
          uInt8Array[i] = raw.charCodeAt(i);
        }
        
        const blob = new Blob([uInt8Array], { type: contentType });
        formData.append('media', blob, `snap.${contentType.split('/')[1]}`);
      } else {
        // Native: Prepare file for upload
        const filename = uri.split('/').pop() || 'snap.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const mimeType = match ? `image/${match[1]}` : `image/jpeg`;

        formData.append('media', {
          uri: uri,
          name: filename,
          type: mimeType,
        } as any);
      }
      
      formData.append('receiverId', selectedFriend);
      formData.append('duration', duration.toString());
      formData.append('mediaType', type || 'image');

      console.log('Sending snap...');
      await sendSnap(formData);
      router.replace('/(tabs)/chat');
    } catch (err: any) {
      console.error('Failed to send snap:', err);
      alert('Failed to send snap: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsSending(false);
    }
  };

  const togglePicker = () => setIsPickerVisible(!isPickerVisible);

  return (
    <SafeAreaView style={styles.container}>
      <Image source={{ uri }} style={styles.preview} />

      <View style={styles.overlay}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
            <Ionicons name="close" size={30} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.sideBar}>
          <TouchableOpacity 
            style={styles.sideBtn} 
            onPress={() => setDuration(prev => (prev >= 10 ? 1 : prev + 1))}
          >
            <Ionicons name="timer-outline" size={24} color="#fff" />
            <Text style={styles.sideBtnText}>{duration}s</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomBar}>
          <Button 
            title={selectedFriend ? "Send Snap" : "Send To..."} 
            onPress={togglePicker}
            style={styles.sendBtn}
            variant="primary"
          />
        </View>
      </View>

      <Modal visible={isPickerVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Send To</Text>
              <TouchableOpacity onPress={togglePicker}>
                <Ionicons name="close" size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={friends}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={[
                    styles.friendItem,
                    selectedFriend === item._id && styles.friendItemSelected
                  ]}
                  onPress={() => setSelectedFriend(item._id)}
                >
                  <Avatar uri={item.avatar} displayName={item.displayName} size={40} />
                  <Text style={styles.friendName}>{item.displayName}</Text>
                  {selectedFriend === item._id && (
                    <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
                  )}
                </TouchableOpacity>
              )}
              contentContainerStyle={styles.friendList}
            />

            <Button 
              title={isSending ? "Sending..." : "Confirm Send"} 
              onPress={handleSend}
              disabled={!selectedFriend || isSending}
              loading={isSending}
              style={styles.confirmBtn}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  preview: {
    ...StyleSheet.absoluteFillObject,
    resizeMode: 'cover',
  },
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
    padding: SPACING.md,
  },
  topBar: {
    flexDirection: 'row',
  },
  sideBar: {
    position: 'absolute',
    right: SPACING.lg,
    top: 100,
    gap: SPACING.lg,
  },
  bottomBar: {
    paddingBottom: 20,
    alignItems: 'center',
  },
  iconBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sideBtn: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    width: 50,
  },
  sideBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 4,
  },
  sendBtn: {
    width: 200,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.bgCard,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    height: '60%',
    padding: SPACING.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  modalTitle: {
    fontSize: FONTS.sizes.xl,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  friendList: {
    paddingBottom: SPACING.xl,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  friendItemSelected: {
    backgroundColor: COLORS.primaryDim,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.sm,
  },
  friendName: {
    flex: 1,
    marginLeft: SPACING.md,
    color: COLORS.textPrimary,
    fontSize: FONTS.sizes.md,
  },
  confirmBtn: {
    marginTop: SPACING.md,
  },
});
