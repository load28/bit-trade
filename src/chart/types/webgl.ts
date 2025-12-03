/**
 * BitChart - WebGL Types
 * WebGL 렌더링을 위한 타입 정의
 */

/** 셰이더 타입 */
export type ShaderType = 'vertex' | 'fragment';

/** 셰이더 소스 */
export interface ShaderSource {
  vertex: string;
  fragment: string;
}

/** 셰이더 프로그램 정보 */
export interface ShaderProgramInfo {
  program: WebGLProgram;
  attribLocations: Record<string, number>;
  uniformLocations: Record<string, WebGLUniformLocation | null>;
}

/** Uniform 타입 */
export type UniformType =
  | 'float'
  | 'vec2'
  | 'vec3'
  | 'vec4'
  | 'mat3'
  | 'mat4'
  | 'int'
  | 'sampler2D';

/** Uniform 정의 */
export interface UniformDefinition {
  name: string;
  type: UniformType;
}

/** Attribute 정의 */
export interface AttributeDefinition {
  name: string;
  size: number; // components per vertex (1, 2, 3, or 4)
  type: number; // gl.FLOAT, gl.INT, etc.
  normalized?: boolean;
  stride?: number;
  offset?: number;
  divisor?: number; // for instanced rendering (0 = per vertex, 1 = per instance)
}

/** 버퍼 사용 힌트 */
export type BufferUsage = 'static' | 'dynamic' | 'stream';

/** 버퍼 설정 */
export interface BufferConfig {
  usage: BufferUsage;
  data?: ArrayBufferView;
}

/** VAO 설정 */
export interface VAOConfig {
  attributes: AttributeDefinition[];
  indexBuffer?: WebGLBuffer;
}

/** UBO 레이아웃 (std140) */
export interface UBOLayout {
  /** 블록 이름 */
  blockName: string;
  /** 바인딩 포인트 */
  bindingPoint: number;
  /** 버퍼 크기 (bytes) */
  size: number;
}

/** 차트 Uniforms (UBO에 저장) */
export interface ChartUniforms {
  /** Projection 행렬 (16 floats) */
  projection: Float32Array;
  /** View 행렬 (16 floats) */
  view: Float32Array;
  /** 뷰포트 (x, y, width, height) */
  viewport: Float32Array;
  /** 가격 범위 (minPrice, maxPrice, padding, padding) */
  priceRange: Float32Array;
  /** 시간 범위 (minTime, maxTime, candleWidth, gap) */
  timeRange: Float32Array;
  /** 볼륨 범위 (minVolume, maxVolume, height, padding) */
  volumeRange: Float32Array;
  /** 색상 (upR, upG, upB, upA, downR, downG, downB, downA) */
  colors: Float32Array;
}

/** 렌더링 상태 */
export interface RenderState {
  /** 블렌딩 활성화 */
  blend: boolean;
  /** 깊이 테스트 활성화 */
  depthTest: boolean;
  /** 컬링 활성화 */
  cullFace: boolean;
  /** 컬링 방향 */
  cullFaceMode: 'front' | 'back';
}

/** 렌더링 통계 */
export interface RenderStats {
  /** Draw call 수 */
  drawCalls: number;
  /** 렌더링된 인스턴스 수 */
  instances: number;
  /** 프레임 시간 (ms) */
  frameTime: number;
  /** FPS */
  fps: number;
}

/** WebGL 확장 */
export interface WebGLExtensions {
  /** Instanced Arrays (WebGL 1.0 폴백용) */
  instancedArrays?: ANGLE_instanced_arrays;
  /** VAO (WebGL 1.0 폴백용) */
  vertexArrayObject?: OES_vertex_array_object;
  /** Float 텍스처 */
  floatTexture?: OES_texture_float;
  /** 디버그 정보 */
  debugRendererInfo?: WEBGL_debug_renderer_info;
}

/** 텍스처 설정 */
export interface TextureConfig {
  width: number;
  height: number;
  format: number; // gl.RGBA, gl.RGB, etc.
  type: number; // gl.UNSIGNED_BYTE, gl.FLOAT, etc.
  minFilter?: number;
  magFilter?: number;
  wrapS?: number;
  wrapT?: number;
  data?: ArrayBufferView | null;
}

/** 프레임버퍼 설정 */
export interface FramebufferConfig {
  width: number;
  height: number;
  colorAttachments: number;
  depthAttachment?: boolean;
  stencilAttachment?: boolean;
}
