import { useMemo } from 'react';
import { useCameraDevice, useFrameProcessor } from 'react-native-vision-camera';
import { useFaceDetector, Face } from 'react-native-vision-camera-face-detector';
import { useSharedValue } from 'react-native-reanimated';

export const useFaceDetection = () => {
  const device = useCameraDevice('front');
  const { detectFaces } = useFaceDetector({
    performanceMode: 'fast',
    landmarkMode: 'all',
    classificationMode: 'all',
  });
  
  // Shared value to pass face data to the UI/Shader thread
  const faceData = useSharedValue<Face | null>(null);

  const frameProcessor = useFrameProcessor((frame) => {
    'worklet';
    const faces = detectFaces(frame);
    if (faces && faces.length > 0) {
      faceData.value = faces[0];
    } else {
      faceData.value = null;
    }
  }, [detectFaces]);

  return { device, frameProcessor, faceData };
};
