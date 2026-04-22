import { Skia, SkRuntimeEffect } from '@shopify/react-native-skia';

const SQUISH_SHADER_SOURCE = `
  uniform shader image;
  uniform vec2 canvasSize;
  uniform vec4 leftEye;  // [x, y, radius, intensity]
  uniform vec4 rightEye; // [x, y, radius, intensity]
  uniform vec4 mouth;    // [x, y, width, stretch]

  vec2 distort(vec2 uv, vec2 center, float radius, float intensity) {
    vec2 dir = uv - center;
    float dist = length(dir);
    if (dist < radius) {
      // Bulge effect: pixels are "pushed" towards the center
      float percent = dist / radius;
      return center + dir * pow(percent, intensity);
    }
    return uv;
  }

  vec2 smile(vec2 uv, vec2 center, float width, float stretch) {
    vec2 dir = uv - center;
    // Stretch mouth corners upwards and outwards
    if (abs(dir.x) < width && abs(dir.y) < width * 0.6) {
      float xFactor = dir.x / width;
      float bend = (1.0 - xFactor * xFactor) * stretch;
      return vec2(uv.x, uv.y - bend);
    }
    return uv;
  }

  half4 main(vec2 pos) {
    vec2 uv = pos;
    uv = distort(uv, leftEye.xy, leftEye.z, leftEye.w);
    uv = distort(uv, rightEye.xy, rightEye.z, rightEye.w);
    uv = smile(uv, mouth.xy, mouth.z, mouth.w);
    return image.eval(uv);
  }
`;

/**
 * AGSL Shader for "Squish Face" AR Lens.
 * Defer creation until Skia is initialized (crucial for Web).
 */
export const getSquishFaceShader = (): SkRuntimeEffect | null => {
  try {
    if (typeof Skia !== 'undefined' && Skia.RuntimeEffect) {
      return Skia.RuntimeEffect.Make(SQUISH_SHADER_SOURCE);
    }
  } catch (e) {
    console.warn("Skia/CanvasKit not initialized yet");
  }
  return null;
};
