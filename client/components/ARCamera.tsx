import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Dimensions, Text } from 'react-native';
import { COLORS } from '../constants/theme';

const { width, height } = Dimensions.get('window');

// PURE WEBGL Implementation (Firewall Safe, No Skia dependencies on Web)
const FRAGMENT_SHADER = `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uImage;
  uniform vec2 uLeftEye;
  uniform vec2 uRightEye;
  uniform vec2 uMouth;

  vec2 distort(vec2 uv, vec2 center, float radius, float intensity) {
    vec2 dir = uv - center;
    float dist = length(dir);
    if (dist < radius) {
      float percent = dist / radius;
      return center + dir * pow(percent, intensity);
    }
    return uv;
  }

  vec2 smile(vec2 uv, vec2 center, float width, float stretch) {
    vec2 dir = uv - center;
    if (abs(dir.x) < width && abs(dir.y) < width * 0.6) {
      float xFactor = dir.x / width;
      float bend = (1.0 - xFactor * xFactor) * stretch;
      return vec2(uv.x, uv.y - bend);
    }
    return uv;
  }

  void main() {
    vec2 uv = vUv;
    // Apply Eye Bulge (Exact same math as mobile)
    uv = distort(uv, uLeftEye, 0.15, 0.4);
    uv = distort(uv, uRightEye, 0.15, 0.4);
    // Apply Mouth Stretch
    uv = smile(uv, uMouth, 0.25, 0.08);
    gl_FragColor = texture2D(uImage, uv);
  }
`;

const VERTEX_SHADER = `
  attribute vec2 aPosition;
  varying vec2 vUv;
  void main() {
    vUv = aPosition * 0.5 + 0.5;
    vUv.y = 1.0 - vUv.y;
    gl_Position = vec4(aPosition, 0, 1);
  }
`;

export default function ARCamera() {
  const canvasRef = useRef<any>(null);
  const uniformsRef = useRef({ 
    leftEye: [0.4, 0.4], 
    rightEye: [0.6, 0.4], 
    mouth: [0.5, 0.7] 
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext('webgl');
    if (!gl) {
      console.error("WebGL not supported");
      return;
    }

    const createShader = (gl: any, type: any, source: string) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, source);
      gl.compileShader(s);
      return s;
    };

    const program = gl.createProgram();
    gl.attachShader(program, createShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER));
    gl.attachShader(program, createShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER));
    gl.linkProgram(program);
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const posLoc = gl.getAttribLocation(program, 'aPosition');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    const texture = gl.createTexture();
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1000';
    
    img.onload = () => {
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      render();
    };

    const render = () => {
      gl.uniform2fv(gl.getUniformLocation(program, 'uLeftEye'), uniformsRef.current.leftEye);
      gl.uniform2fv(gl.getUniformLocation(program, 'uRightEye'), uniformsRef.current.rightEye);
      gl.uniform2fv(gl.getUniformLocation(program, 'uMouth'), uniformsRef.current.mouth);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      requestAnimationFrame(render);
    };
  }, []);

  const onMouseMove = (e: any) => {
    // Extract coordinates safely for web testing
    const { locationX, locationY } = e.nativeEvent;
    uniformsRef.current = {
      leftEye: [(locationX / width) - 0.08, locationY / height],
      rightEye: [(locationX / width) + 0.08, locationY / height],
      mouth: [locationX / width, (locationY / height) + 0.12],
    };
  };

  return (
    <View 
      style={styles.container} 
      onResponderMove={onMouseMove} 
      onStartShouldSetResponder={() => true}
    >
      <View style={styles.header}>
        <Text style={styles.webNotice}>💻 PURE WEBGL MODE (Firewall Safe)</Text>
        <Text style={styles.webSubNotice}>Move mouse to test the "Squish" logic</Text>
      </View>
      <canvas ref={canvasRef} width={width} height={height} style={{ width, height }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { 
    position: 'absolute', 
    top: 60, 
    left: 0, 
    right: 0, 
    alignItems: 'center', 
    zIndex: 100,
    pointerEvents: 'none'
  },
  webNotice: { 
    color: COLORS.primary, 
    fontWeight: 'bold', 
    fontSize: 14, 
    backgroundColor: 'rgba(0,0,0,0.8)', 
    padding: 8, 
    borderRadius: 4 
  },
  webSubNotice: {
    color: '#fff',
    fontSize: 11,
    marginTop: 6,
    opacity: 0.7
  }
});
