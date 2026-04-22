import React, { useEffect, useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  Image, 
  TouchableOpacity, 
  SafeAreaView,
  Dimensions,
  Platform
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  runOnJS,
  Easing
} from 'react-native-reanimated';
import { useSnapStore } from '../../stores/snapStore';
import { COLORS, SPACING, FONTS, RADIUS } from '../../constants/theme';

const { width } = Dimensions.get('window');

export default function SnapView() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { receivedSnaps, markSnapViewed } = useSnapStore();
  const [timeLeft, setTimeLeft] = useState(0);
  const progress = useSharedValue(0);
  const router = useRouter();

  const snap = receivedSnaps.find(s => s._id === id);

  const FILTERS = [
    { id: 'glow', label: 'Glow', color: 'rgba(255, 255, 200, 0.2)' },
    { id: 'moonlight', label: 'Moonlight', color: 'rgba(200, 200, 255, 0.15)' },
    { id: 'gold', label: 'Gold', color: 'rgba(255, 215, 0, 0.18)' },
    { id: 'frame', label: 'Frame', color: 'transparent', frame: true },
    { id: 'sunset', label: 'Sunset', color: 'rgba(255, 0, 100, 0.1)' },
  ];

  useEffect(() => {
    if (!snap) {
      router.back();
      return;
    }

    if (snap.duration > 0) {
      setTimeLeft(snap.duration);
      // Start animation
      progress.value = withTiming(1, { 
        duration: snap.duration * 1000,
        easing: Easing.linear
      }, (finished) => {
        if (finished) {
          runOnJS(handleFinish)();
        }
      });

      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    } else {
      setTimeLeft(0); // Represent infinity
    }
  }, [snap]);

  const handleFinish = async () => {
    if (id) {
      await markSnapViewed(id);
    }
    router.back();
  };

  const closeSnap = () => {
    handleFinish(); // Always mark viewed when manually closed
  };

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  if (!snap) return null;

  return (
    <View style={styles.container}>
      <View style={styles.contentContainer}>
        <Image 
          source={{ uri: snap.mediaUrl }} 
          style={[
            styles.content,
            (snap as any).isMirrored && { transform: [{ scaleX: -1 }] }
          ]} 
        />
        {/* Filter Overlay */}
        <View 
          style={[
            styles.filterOverlay, 
            { backgroundColor: FILTERS.find(f => f.id === (snap as any).filter)?.color || 'transparent' }
          ]} 
        />

        {/* Glow Enhancement */}
        {(snap as any).filter === 'glow' && (
          <View style={[styles.filterOverlay, { backgroundColor: 'rgba(255,255,255,0.1)' }]} />
        )}

        {/* Frame Filter */}
        {FILTERS.find(f => f.id === (snap as any).filter)?.frame && (
          <View style={styles.frameOverlay}>
            <View style={styles.whiteFrame} />
          </View>
        )}
      </View>

      <SafeAreaView style={styles.overlay}>
        <View style={styles.topBar}>
          {snap.duration > 0 && (
            <View style={styles.progressContainer}>
              <Animated.View style={[styles.progressBar, progressStyle]} />
            </View>
          )}
          <View style={styles.header}>
            <View>
              <Text style={styles.senderName}>{snap.sender.displayName}</Text>
              <View style={styles.durationRow}>
                {snap.duration === 0 ? (
                  <Ionicons name="infinite-outline" size={14} color="rgba(255,255,255,0.8)" />
                ) : (
                  <Text style={styles.timeTag}>{timeLeft}s left</Text>
                )}
              </View>
            </View>
            <TouchableOpacity onPress={closeSnap} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  contentContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    flex: 1,
    resizeMode: 'contain',
  },
  filterOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  frameOverlay: {
    ...StyleSheet.absoluteFillObject,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  whiteFrame: {
    width: '100%',
    height: '100%',
    borderWidth: 15,
    borderColor: '#fff',
    borderRadius: RADIUS.lg,
  },
  overlay: {
    flex: 1,
  },
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  topBar: {
    padding: SPACING.md,
  },
  progressContainer: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 1.5,
    overflow: 'hidden',
    marginBottom: SPACING.sm,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  senderName: {
    color: '#fff',
    fontSize: FONTS.sizes.md,
    fontWeight: 'bold',
  },
  timeTag: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 10,
  },
  closeBtn: {
    padding: 10,
  },
});
