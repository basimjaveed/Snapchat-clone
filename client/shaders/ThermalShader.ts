import { Skia, SkRuntimeEffect } from '@shopify/react-native-skia';

const THERMAL_SHADER_SOURCE = `
  uniform shader image;
  uniform vec2 canvasSize;

  half4 main(vec2 pos) {
    vec4 color = image.eval(pos);
    float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114));
    
    vec3 thermal;
    if (gray < 0.25) {
      thermal = mix(vec3(0.0, 0.0, 0.5), vec3(0.0, 0.0, 1.0), gray * 4.0);
    } else if (gray < 0.5) {
      thermal = mix(vec3(0.0, 0.0, 1.0), vec3(0.0, 1.0, 0.0), (gray - 0.25) * 4.0);
    } else if (gray < 0.75) {
      thermal = mix(vec3(0.0, 1.0, 0.0), vec3(1.0, 1.0, 0.0), (gray - 0.5) * 4.0);
    } else {
      thermal = mix(vec3(1.0, 1.0, 0.0), vec3(1.0, 0.0, 0.0), (gray - 0.75) * 4.0);
    }
    
    return half4(thermal, 1.0);
  }
`;

export const getThermalShader = (): SkRuntimeEffect | null => {
  try {
    if (typeof Skia !== 'undefined' && Skia.RuntimeEffect) {
      return Skia.RuntimeEffect.Make(THERMAL_SHADER_SOURCE);
    }
  } catch (e) {
    console.warn("Skia/CanvasKit not initialized yet");
  }
  return null;
};
