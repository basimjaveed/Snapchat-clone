import { Skia, SkRuntimeEffect } from '@shopify/react-native-skia';

const COMIC_SHADER_SOURCE = `
  uniform shader image;
  uniform vec2 canvasSize;

  half4 main(vec2 pos) {
    vec4 color = image.eval(pos);
    
    // Posterize
    float levels = 5.0;
    vec3 posterized = floor(color.rgb * levels) / levels;
    
    // Simple Edge Detection (approximate)
    vec4 colorRight = image.eval(pos + vec2(1.0, 0.0));
    vec4 colorDown = image.eval(pos + vec2(0.0, 1.0));
    float edge = length(color.rgb - colorRight.rgb) + length(color.rgb - colorDown.rgb);
    
    vec3 finalColor = posterized;
    if (edge > 0.2) {
      finalColor = vec3(0.0); // Black edges
    }
    
    return half4(finalColor, 1.0);
  }
`;

export const getComicShader = (): SkRuntimeEffect | null => {
  try {
    if (typeof Skia !== 'undefined' && Skia.RuntimeEffect) {
      return Skia.RuntimeEffect.Make(COMIC_SHADER_SOURCE);
    }
  } catch (e) {
    console.warn("Skia/CanvasKit not initialized yet");
  }
  return null;
};
