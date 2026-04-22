import React, { useMemo } from 'react';
import { StyleSheet, View, Dimensions, ActivityIndicator, Text } from 'react-native';
import { Camera } from 'react-native-vision-camera';
import { Canvas, Shader, Fill, ImageShader } from '@shopify/react-native-skia';
import { useDerivedValue } from 'react-native-reanimated';
import { useFaceDetection } from '../hooks/useFaceDetection';
import { getSquishFaceShader } from '../shaders/SquishFaceShader';
import { COLORS } from '../constants/theme';

const { width, height } = Dimensions.get('window');

export default function ARCamera() {
  const { device, frameProcessor, faceData } = useFaceDetection();
  
  const shader = useMemo(() => getSquishFaceShader(), []);

  const uniforms = useDerivedValue(() => {
    if (!faceData.value) {
      return {
        canvasSize: [width, height],
        leftEye: [0, 0, 0, 1],
        rightEye: [0, 0, 0, 1],
        mouth: [0, 0, 0, 0],
      };
    }

    const face = faceData.value;
    return {
      canvasSize: [width, height],
      leftEye: [face.leftEye.x, face.leftEye.y, 70, 0.4],
      rightEye: [face.rightEye.x, face.rightEye.y, 70, 0.4],
      mouth: [face.mouthCenter.x, face.mouthCenter.y, 120, 40],
    };
  }, [faceData]);

  if (!device || !shader) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.text}>Initializing AR Lens...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={true}
        frameProcessor={frameProcessor}
        pixelFormat="yuv"
      />
      <Canvas style={styles.canvas}>
        <Fill>
          <Shader source={shader} uniforms={uniforms}>
            <ImageShader image={null} fit="cover" rect={{ x: 0, y: 0, width, height }} />
          </Shader>
        </Fill>
      </Canvas>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  canvas: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
  text: { color: '#fff', marginTop: 10, fontWeight: 'bold' },
});
