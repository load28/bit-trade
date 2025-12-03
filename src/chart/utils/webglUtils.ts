/**
 * BitChart - WebGL Utilities
 * WebGL 렌더링을 위한 유틸리티 함수들
 */

import type { ShaderProgramInfo, WebGLExtensions } from '../types/webgl';

/**
 * WebGL 2.0 컨텍스트 생성
 */
export function createWebGL2Context(
  canvas: HTMLCanvasElement | OffscreenCanvas,
  options?: WebGLContextAttributes
): WebGL2RenderingContext | null {
  const defaultOptions: WebGLContextAttributes = {
    alpha: false,
    antialias: true,
    depth: false,
    stencil: false,
    powerPreference: 'high-performance',
    preserveDrawingBuffer: false,
    failIfMajorPerformanceCaveat: false,
    ...options,
  };

  const gl = canvas.getContext('webgl2', defaultOptions) as WebGL2RenderingContext | null;

  if (!gl) {
    console.error('WebGL 2.0 is not supported in this browser');
    return null;
  }

  return gl;
}

/**
 * 셰이더 컴파일
 */
export function compileShader(
  gl: WebGL2RenderingContext,
  type: number,
  source: string
): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) {
    console.error('Failed to create shader');
    return null;
  }

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader);
    console.error('Shader compilation error:', info);
    console.error('Shader source:', source);
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}

/**
 * 셰이더 프로그램 생성
 */
export function createProgram(
  gl: WebGL2RenderingContext,
  vertexSource: string,
  fragmentSource: string
): WebGLProgram | null {
  const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexSource);
  const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);

  if (!vertexShader || !fragmentShader) {
    return null;
  }

  const program = gl.createProgram();
  if (!program) {
    console.error('Failed to create program');
    return null;
  }

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const info = gl.getProgramInfoLog(program);
    console.error('Program linking error:', info);
    gl.deleteProgram(program);
    return null;
  }

  // 셰이더 정리 (프로그램에 연결된 후에는 삭제 가능)
  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);

  return program;
}

/**
 * 셰이더 프로그램 정보 추출
 */
export function getProgramInfo(
  gl: WebGL2RenderingContext,
  program: WebGLProgram,
  attributeNames: string[],
  uniformNames: string[]
): ShaderProgramInfo {
  const attribLocations: Record<string, number> = {};
  const uniformLocations: Record<string, WebGLUniformLocation | null> = {};

  for (const name of attributeNames) {
    attribLocations[name] = gl.getAttribLocation(program, name);
  }

  for (const name of uniformNames) {
    uniformLocations[name] = gl.getUniformLocation(program, name);
  }

  return {
    program,
    attribLocations,
    uniformLocations,
  };
}

/**
 * WebGL 확장 가져오기
 */
export function getExtensions(gl: WebGL2RenderingContext): WebGLExtensions {
  return {
    debugRendererInfo: gl.getExtension('WEBGL_debug_renderer_info') || undefined,
    floatTexture: gl.getExtension('OES_texture_float') || undefined,
  };
}

/**
 * GPU 정보 가져오기
 */
export function getGPUInfo(gl: WebGL2RenderingContext): {
  renderer: string;
  vendor: string;
  maxTextureSize: number;
  maxViewportDims: Int32Array;
} {
  const ext = gl.getExtension('WEBGL_debug_renderer_info');

  return {
    renderer: ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : 'Unknown',
    vendor: ext ? gl.getParameter(ext.UNMASKED_VENDOR_WEBGL) : 'Unknown',
    maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
    maxViewportDims: gl.getParameter(gl.MAX_VIEWPORT_DIMS),
  };
}

/**
 * 4x4 단위 행렬 생성
 */
export function createIdentityMatrix(): Float32Array {
  return new Float32Array([
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1,
  ]);
}

/**
 * 2D 직교 투영 행렬 생성
 */
export function createOrthographicMatrix(
  left: number,
  right: number,
  bottom: number,
  top: number,
  near: number = -1,
  far: number = 1
): Float32Array {
  const lr = 1 / (left - right);
  const bt = 1 / (bottom - top);
  const nf = 1 / (near - far);

  return new Float32Array([
    -2 * lr, 0, 0, 0,
    0, -2 * bt, 0, 0,
    0, 0, 2 * nf, 0,
    (left + right) * lr, (top + bottom) * bt, (far + near) * nf, 1,
  ]);
}

/**
 * 행렬 곱셈 (4x4)
 */
export function multiplyMatrices(a: Float32Array, b: Float32Array): Float32Array {
  const result = new Float32Array(16);

  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      result[i * 4 + j] =
        a[i * 4 + 0] * b[0 * 4 + j] +
        a[i * 4 + 1] * b[1 * 4 + j] +
        a[i * 4 + 2] * b[2 * 4 + j] +
        a[i * 4 + 3] * b[3 * 4 + j];
    }
  }

  return result;
}

/**
 * 스케일 행렬 생성
 */
export function createScaleMatrix(sx: number, sy: number, sz: number = 1): Float32Array {
  return new Float32Array([
    sx, 0, 0, 0,
    0, sy, 0, 0,
    0, 0, sz, 0,
    0, 0, 0, 1,
  ]);
}

/**
 * 이동 행렬 생성
 */
export function createTranslationMatrix(tx: number, ty: number, tz: number = 0): Float32Array {
  return new Float32Array([
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    tx, ty, tz, 1,
  ]);
}

/**
 * 색상 문자열을 RGBA 배열로 변환
 */
export function parseColor(color: string): [number, number, number, number] {
  // Hex 색상 (#RGB, #RRGGBB, #RRGGBBAA)
  if (color.startsWith('#')) {
    const hex = color.slice(1);
    if (hex.length === 3) {
      const r = parseInt(hex[0] + hex[0], 16) / 255;
      const g = parseInt(hex[1] + hex[1], 16) / 255;
      const b = parseInt(hex[2] + hex[2], 16) / 255;
      return [r, g, b, 1];
    }
    if (hex.length === 6) {
      const r = parseInt(hex.slice(0, 2), 16) / 255;
      const g = parseInt(hex.slice(2, 4), 16) / 255;
      const b = parseInt(hex.slice(4, 6), 16) / 255;
      return [r, g, b, 1];
    }
    if (hex.length === 8) {
      const r = parseInt(hex.slice(0, 2), 16) / 255;
      const g = parseInt(hex.slice(2, 4), 16) / 255;
      const b = parseInt(hex.slice(4, 6), 16) / 255;
      const a = parseInt(hex.slice(6, 8), 16) / 255;
      return [r, g, b, a];
    }
  }

  // rgba() 형식
  const rgbaMatch = color.match(/rgba?\s*\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)/);
  if (rgbaMatch) {
    const r = parseFloat(rgbaMatch[1]) / 255;
    const g = parseFloat(rgbaMatch[2]) / 255;
    const b = parseFloat(rgbaMatch[3]) / 255;
    const a = rgbaMatch[4] !== undefined ? parseFloat(rgbaMatch[4]) : 1;
    return [r, g, b, a];
  }

  // 기본값: 흰색
  return [1, 1, 1, 1];
}

/**
 * 버퍼 사용 힌트를 WebGL 상수로 변환
 */
export function getBufferUsage(
  gl: WebGL2RenderingContext,
  usage: 'static' | 'dynamic' | 'stream'
): number {
  switch (usage) {
    case 'static':
      return gl.STATIC_DRAW;
    case 'dynamic':
      return gl.DYNAMIC_DRAW;
    case 'stream':
      return gl.STREAM_DRAW;
    default:
      return gl.STATIC_DRAW;
  }
}

/**
 * 디바이스 픽셀 비율 가져오기
 */
export function getDevicePixelRatio(): number {
  return typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
}

/**
 * 캔버스 크기를 디바이스 픽셀 비율에 맞게 조정
 */
export function resizeCanvasToDisplaySize(
  canvas: HTMLCanvasElement,
  devicePixelRatio: number = getDevicePixelRatio()
): boolean {
  const displayWidth = Math.floor(canvas.clientWidth * devicePixelRatio);
  const displayHeight = Math.floor(canvas.clientHeight * devicePixelRatio);

  if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
    canvas.width = displayWidth;
    canvas.height = displayHeight;
    return true;
  }

  return false;
}

/**
 * WebGL 에러 체크
 */
export function checkGLError(gl: WebGL2RenderingContext, operation: string): void {
  const error = gl.getError();
  if (error !== gl.NO_ERROR) {
    let errorMessage = 'Unknown error';
    switch (error) {
      case gl.INVALID_ENUM:
        errorMessage = 'INVALID_ENUM';
        break;
      case gl.INVALID_VALUE:
        errorMessage = 'INVALID_VALUE';
        break;
      case gl.INVALID_OPERATION:
        errorMessage = 'INVALID_OPERATION';
        break;
      case gl.INVALID_FRAMEBUFFER_OPERATION:
        errorMessage = 'INVALID_FRAMEBUFFER_OPERATION';
        break;
      case gl.OUT_OF_MEMORY:
        errorMessage = 'OUT_OF_MEMORY';
        break;
      case gl.CONTEXT_LOST_WEBGL:
        errorMessage = 'CONTEXT_LOST_WEBGL';
        break;
    }
    console.error(`WebGL Error during ${operation}: ${errorMessage}`);
  }
}
