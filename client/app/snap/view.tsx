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
import { COLORS, SPACING, FONTS } from '../../constants/theme';

const { width } = Dimensions.get('window');

export default function SnapView() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { receivedSnaps, markSnapViewed } = useSnapStore();
  const [timeLeft, setTimeLeft] = useState(0);
  const progress = useSharedValue(0);
  const router = useRouter();

  const snap = receivedSnaps.find(s => s._id === id);

  useEffect(() => {
    if (!snap) {
      router.back();
      return;
    }

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
  }, [snap]);

  const handleFinish = async () => {
    if (id) {
      await markSnapViewed(id);
    }
    router.back();
  };

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  if (!snap) return null;

  return (
    <View style={styles.container}>
      <Image source={{ uri: snap.mediaUrl }} style={styles.content} />

      <SafeAreaView style={styles.overlay}>
        <View style={styles.topBar}>
          <View style={styles.progressContainer}>
            <Animated.View style={[styles.progressBar, progressStyle]} />
          </View>
          <View style={styles.header}>
            <View>
              <Text style={styles.senderName}>{snap.sender.displayName}</Text>
              <Text style={styles.timeTag}>{timeLeft}s left</Text>
            </View>
            <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
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
  content: {
    ...StyleSheet.absoluteFillObject,
    resizeMode: 'contain',
  },
  overlay: {
    flex: 1,
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
