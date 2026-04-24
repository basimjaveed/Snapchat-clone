import React, { useMemo } from 'react';
import { StyleSheet, View, Dimensions, PanResponder } from 'react-native';
import { 
  Canvas, 
  Shader, 
  Skia, 
  useValue, 
  Fill
} from '@shopify/react-native-skia';

const { width, height } = Dimensions.get('window');

// Professional GLSL Squish Shader (Compatible with Skia)
const SQUISH_SHADER = `
uniform float2 uLeftEye;
uniform float2 uRightEye;
uniform float2 uMouth;
uniform float uIntensity;

float2 distort(float2 uv, float2 center, float radius, float intensity) {
  float2 dir = uv - center;
  float dist = length(dir);
  if (dist < radius) {
    float percent = dist / radius;
    return center + dir * pow(percent, intensity);
  }
  return uv;
}

float4 main(float2 pos) {
  float2 uv = pos / float2(${width.toFixed(1)}, ${height.toFixed(1)});
  
  // Apply squish distortions
  float2 dUv = uv;
  dUv = distort(dUv, uLeftEye, 0.15, uIntensity);
  dUv = distort(dUv, uRightEye, 0.15, uIntensity);
  
  // In a real app, we'd sample the camera feed here. 
  // For this APK test, we'll use a color gradient to verify the math is working.
  return float4(dUv.x, dUv.y, 1.0, 1.0);
}
`;

interface ARCameraProps {
  isLive?: boolean;
  onZoomChange?: (zoom: number) => void;
  currentZoom?: number;
}

export default function ARCamera({ isLive, onZoomChange, currentZoom = 0 }: ARCameraProps) {
  const leftEye = useValue({ x: width * 0.4, y: height * 0.4 });
  const rightEye = useValue({ x: width * 0.6, y: height * 0.4 });
  const mouth = useValue({ x: width * 0.5, y: height * 0.6 });

  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetResponder: () => true,
    onPanResponderMove: (e, gestureState) => {
      const { moveX, moveY, dy } = gestureState;
      
      // Update "Face" landmarks based on touch
      leftEye.current = { x: moveX - 40, y: moveY };
      rightEye.current = { x: moveX + 40, y: moveY };
      mouth.current = { x: moveX, y: moveY + 60 };

      // Vertical movement controls the actual camera zoom
      if (onZoomChange) {
        const newZoom = Math.max(0, Math.min(1, -dy / 300));
        onZoomChange(newZoom);
      }
    },
  }), [onZoomChange]);

  const source = Skia.RuntimeEffect.Make(SQUISH_SHADER);

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      <Canvas style={styles.canvas}>
        <Fill>
          <Shader
            source={source!}
            uniforms={{
              uLeftEye: [leftEye.current.x, leftEye.current.y],
              uRightEye: [rightEye.current.x, rightEye.current.y],
              uMouth: [mouth.current.x, mouth.current.y],
              uIntensity: 0.5,
            }}
          />
        </Fill>
      </Canvas>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
  canvas: {
    flex: 1,
  },
});
