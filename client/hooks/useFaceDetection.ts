import { useSharedValue } from 'react-native-reanimated';

/**
 * Web fallback for face detection.
 */
export const useFaceDetection = () => {
  const faceData = useSharedValue(null);
  return { 
    device: null, 
    frameProcessor: null, 
    faceData 
  };
};
