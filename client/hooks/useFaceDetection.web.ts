import { useSharedValue } from 'react-native-reanimated';

/**
 * Web fallback for face detection.
 * Returns null as face detection is mocked in ARCamera.web.tsx
 */
export const useFaceDetection = () => {
  const faceData = useSharedValue(null);
  return { 
    device: null, 
    frameProcessor: null, 
    faceData 
  };
};
