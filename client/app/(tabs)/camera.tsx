import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView, Platform, FlatList } from 'react-native';
import { Camera, CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS, SPACING, RADIUS } from '../../constants/theme';
import ARCamera from '../../components/ARCamera';
import { useCameraPermission as useVisionCameraPermission } from 'react-native-vision-camera';

export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<'back' | 'front'>('back');
  const [activeFilter, setActiveFilter] = useState('none');
  const cameraRef = useRef<CameraView>(null);
  const router = useRouter();

  const FILTERS = [
    { id: 'none', label: 'None', color: 'transparent', icon: 'radio-button-off' },
    { id: 'glow', label: 'Glow', color: 'rgba(255, 255, 200, 0.2)', icon: 'sparkles' },
    { id: 'moonlight', label: 'Moonlight', color: 'rgba(200, 200, 255, 0.15)', icon: 'moon-outline' },
    { id: 'gold', label: 'Gold', color: 'rgba(255, 215, 0, 0.18)', icon: 'trophy-outline' },
    { id: 'frame', label: 'Frame', color: 'transparent', icon: 'square-outline' },
    { id: 'sunset', label: 'Sunset', color: 'rgba(255, 0, 100, 0.1)', icon: 'sunny' },
    { id: 'squish', label: 'Squish', color: 'transparent', icon: 'happy-outline', isAR: true },
  ];

  if (!permission) {
    // Camera permissions are still loading.
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet.
    return (
      <View style={styles.container}>
        <Text style={styles.message}>We need your permission to show the camera</Text>
        <TouchableOpacity onPress={requestPermission} style={styles.permissionBtn}>
          <Text style={styles.permissionBtnText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const takePicture = async () => {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.7,
        base64: false,
      });
      if (photo) {
        // Navigate to preview with the image URI
        router.push({
          pathname: '/snap/preview',
          params: { 
            uri: photo.uri, 
            type: 'image',
            filter: activeFilter,
            isMirrored: facing === 'front' ? 'true' : 'false'
          }
        });
      }
    }
  };

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  return (
    <View style={styles.container}>
      <View style={styles.cameraContainer}>
        {activeFilter === 'squish' ? (
          <ARCamera />
        ) : (
          <CameraView style={styles.camera} facing={facing} ref={cameraRef}>
            {/* Live Filter Overlay */}
            <View 
              style={[
                styles.filterOverlay, 
                { backgroundColor: FILTERS.find(f => f.id === activeFilter)?.color }
              ]} 
            />

            {/* Frame Filter */}
            {activeFilter === 'frame' && (
              <View style={styles.frameOverlay}>
                <View style={styles.whiteFrame} />
              </View>
            )}
          </CameraView>
        )}
        
        <SafeAreaView style={styles.overlay} pointerEvents="box-none">
          <View style={styles.topBar}>
            <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
              <Ionicons name="close" size={30} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity onPress={toggleCameraFacing} style={styles.iconBtn}>
              <Ionicons name="camera-reverse-outline" size={30} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.bottomBar}>
            <View style={styles.filterSelectorWrapper}>
              <FlatList
                horizontal
                data={FILTERS}
                keyExtractor={(item) => item.id}
                showsHorizontalScrollIndicator={false}
                renderItem={({ item }) => (
                  <TouchableOpacity 
                    style={[
                      styles.filterItem,
                      activeFilter === item.id && styles.filterItemActive
                    ]}
                    onPress={() => setActiveFilter(item.id)}
                  >
                    <View style={[styles.filterThumb, { backgroundColor: item.color || '#fff' }]}>
                      <Ionicons 
                        name={item.icon as any} 
                        size={18} 
                        color={activeFilter === item.id ? '#000' : '#fff'} 
                      />
                    </View>
                    <Text style={styles.filterLabel}>{item.label}</Text>
                  </TouchableOpacity>
                )}
                contentContainerStyle={styles.filterList}
              />
            </View>

            <View style={styles.captureSection}>
              <TouchableOpacity style={styles.captureBtn} onPress={takePicture}>
                <View style={styles.captureBtnInner} />
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  message: {
    textAlign: 'center',
    color: '#fff',
    paddingBottom: 10,
  },
  cameraContainer: {
    flex: 1,
    overflow: 'hidden',
  },
  camera: {
    flex: 1,
  },
  filterOverlay: {
    ...StyleSheet.absoluteFillObject,
    pointerEvents: 'none',
  },
  frameOverlay: {
    ...StyleSheet.absoluteFillObject,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'none',
  },
  whiteFrame: {
    width: '100%',
    height: '100%',
    borderWidth: 15,
    borderColor: '#fff',
    borderRadius: RADIUS.lg,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: SPACING.lg,
  },
  bottomBar: {
    paddingBottom: 20,
  },
  filterSelectorWrapper: {
    marginBottom: SPACING.lg,
  },
  filterList: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.sm,
  },
  filterItem: {
    alignItems: 'center',
    marginRight: SPACING.lg,
    opacity: 0.7,
  },
  filterItemActive: {
    opacity: 1,
  },
  filterThumb: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  filterLabel: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  captureSection: {
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
  captureBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 6,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureBtnInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
  },
  spacer: {
    flex: 1,
  },
  permissionBtn: {
    backgroundColor: COLORS.primary,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    alignSelf: 'center',
  },
  permissionBtnText: {
    color: COLORS.bg,
    fontWeight: 'bold',
  },
});
