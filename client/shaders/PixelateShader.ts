import { Skia, SkRuntimeEffect } from '@shopify/react-native-skia';

const PIXELATE_SHADER_SOURCE = `
  uniform shader image;
  uniform vec2 canvasSize;
  uniform float pixelSize;

  half4 main(vec2 pos) {
    vec2 p = pos;
    if (pixelSize > 1.0) {
      p = floor(pos / pixelSize) * pixelSize + (pixelSize * 0.5);
    }
    return image.eval(p);
  }
`;

export const getPixelateShader = (): SkRuntimeEffect | null => {
  try {
    if (typeof Skia !== 'undefined' && Skia.RuntimeEffect) {
      return Skia.RuntimeEffect.Make(PIXELATE_SHADER_SOURCE);
    }
  } catch (e) {
    console.warn("Skia/CanvasKit not initialized yet");
  }
  return null;
};
