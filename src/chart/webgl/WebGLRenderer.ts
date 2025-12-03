/**
 * BitChart - WebGL Renderer
 * WebGL 2.0 렌더링 엔진 코어
 */

import type { RenderState, RenderStats } from '../types/webgl';
import type { Viewport } from '../types/data';
import type { ChartColors } from '../types/chart';
import { createWebGL2Context, createIdentityMatrix, createOrthographicMatrix, parseColor, getGPUInfo } from '../utils/webglUtils';
import { ShaderManager } from './ShaderManager';
import { BufferManager } from './BufferManager';

/** 렌더러 설정 */
export interface WebGLRendererOptions {
  /** 배경색 */
  backgroundColor?: string;
  /** 안티앨리어싱 */
  antialias?: boolean;
  /** 알파 채널 */
  alpha?: boolean;
}

/**
 * WebGL 렌더러 클래스
 * WebGL 2.0 컨텍스트 관리 및 렌더링 조율
 */
export class WebGLRenderer {
  private canvas: HTMLCanvasElement | OffscreenCanvas;
  private gl: WebGL2RenderingContext;
  private shaderManager: ShaderManager;
  private bufferManager: BufferManager;

  // 행렬
  private projectionMatrix: Float32Array;
  private viewMatrix: Float32Array;

  // 상태
  private width: number = 0;
  private height: number = 0;
  private devicePixelRatio: number = 1;
  private backgroundColor: [number, number, number, number] = [0.05, 0.05, 0.08, 1];

  // 뷰포트
  private viewport: Viewport = {
    timeRange: { from: 0, to: 1 },
    priceRange: { min: 0, max: 1 },
    volumeRange: { min: 0, max: 1 },
  };

  // 색상
  private upColor: Float32Array = new Float32Array([0.129, 0.784, 0.537, 1]); // #21C887
  private downColor: Float32Array = new Float32Array([0.937, 0.325, 0.314, 1]); // #EF5350

  // 통계
  private stats: RenderStats = {
    drawCalls: 0,
    instances: 0,
    frameTime: 0,
    fps: 0,
  };
  private lastFrameTime: number = 0;
  private frameCount: number = 0;
  private fpsUpdateTime: number = 0;

  constructor(
    canvas: HTMLCanvasElement | OffscreenCanvas,
    options: WebGLRendererOptions = {}
  ) {
    this.canvas = canvas;

    // WebGL 2.0 컨텍스트 생성
    const gl = createWebGL2Context(canvas, {
      alpha: options.alpha ?? false,
      antialias: options.antialias ?? true,
    });

    if (!gl) {
      throw new Error('WebGL 2.0 is not supported');
    }

    this.gl = gl;

    // 매니저 초기화
    this.shaderManager = new ShaderManager(gl);
    this.bufferManager = new BufferManager(gl);

    // 행렬 초기화
    this.projectionMatrix = createIdentityMatrix();
    this.viewMatrix = createIdentityMatrix();

    // 배경색 설정
    if (options.backgroundColor) {
      this.backgroundColor = parseColor(options.backgroundColor);
    }

    // 초기 설정
    this.setupGL();

    // 셰이더 미리 컴파일
    this.shaderManager.precompileAll();
  }

  /**
   * WebGL 초기 설정
   */
  private setupGL(): void {
    const gl = this.gl;

    // 블렌딩 설정
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    // 깊이 테스트 비활성화 (2D)
    gl.disable(gl.DEPTH_TEST);

    // 컬링 비활성화
    gl.disable(gl.CULL_FACE);

    // 클리어 색상 설정
    gl.clearColor(...this.backgroundColor);
  }

  /**
   * 캔버스 크기 설정
   */
  setSize(width: number, height: number, devicePixelRatio: number = 1): void {
    this.width = width;
    this.height = height;
    this.devicePixelRatio = devicePixelRatio;

    const pixelWidth = Math.floor(width * devicePixelRatio);
    const pixelHeight = Math.floor(height * devicePixelRatio);

    this.canvas.width = pixelWidth;
    this.canvas.height = pixelHeight;

    this.gl.viewport(0, 0, pixelWidth, pixelHeight);

    // 투영 행렬 업데이트
    this.updateProjection();
  }

  /**
   * 투영 행렬 업데이트
   */
  private updateProjection(): void {
    // 2D 직교 투영 (-1 ~ 1)
    this.projectionMatrix = createOrthographicMatrix(-1, 1, -1, 1, -1, 1);
  }

  /**
   * 뷰포트 설정
   */
  setViewport(viewport: Viewport): void {
    this.viewport = viewport;
  }

  /**
   * 색상 설정
   */
  setColors(colors: Partial<ChartColors>): void {
    if (colors.up) {
      this.upColor = new Float32Array(parseColor(colors.up));
    }
    if (colors.down) {
      this.downColor = new Float32Array(parseColor(colors.down));
    }
    if (colors.background) {
      this.backgroundColor = parseColor(colors.background);
      this.gl.clearColor(...this.backgroundColor);
    }
  }

  /**
   * 프레임 시작
   */
  beginFrame(): void {
    this.stats.drawCalls = 0;
    this.stats.instances = 0;
    this.lastFrameTime = performance.now();

    // 화면 클리어
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
  }

  /**
   * 프레임 종료
   */
  endFrame(): void {
    // FPS 계산
    this.frameCount++;
    const now = performance.now();
    this.stats.frameTime = now - this.lastFrameTime;

    if (now - this.fpsUpdateTime >= 1000) {
      this.stats.fps = this.frameCount;
      this.frameCount = 0;
      this.fpsUpdateTime = now;
    }
  }

  /**
   * Draw call 기록
   */
  recordDrawCall(instances: number = 1): void {
    this.stats.drawCalls++;
    this.stats.instances += instances;
  }

  /**
   * 통계 가져오기
   */
  getStats(): RenderStats {
    return { ...this.stats };
  }

  /**
   * ShaderManager 접근
   */
  getShaderManager(): ShaderManager {
    return this.shaderManager;
  }

  /**
   * BufferManager 접근
   */
  getBufferManager(): BufferManager {
    return this.bufferManager;
  }

  /**
   * WebGL 컨텍스트 접근
   */
  getGL(): WebGL2RenderingContext {
    return this.gl;
  }

  /**
   * 투영 행렬 가져오기
   */
  getProjectionMatrix(): Float32Array {
    return this.projectionMatrix;
  }

  /**
   * 뷰 행렬 가져오기
   */
  getViewMatrix(): Float32Array {
    return this.viewMatrix;
  }

  /**
   * 뷰포트 가져오기
   */
  getViewport(): Viewport {
    return this.viewport;
  }

  /**
   * 상승 색상 가져오기
   */
  getUpColor(): Float32Array {
    return this.upColor;
  }

  /**
   * 하락 색상 가져오기
   */
  getDownColor(): Float32Array {
    return this.downColor;
  }

  /**
   * 캔버스 크기 가져오기
   */
  getSize(): { width: number; height: number; pixelRatio: number } {
    return {
      width: this.width,
      height: this.height,
      pixelRatio: this.devicePixelRatio,
    };
  }

  /**
   * 해상도 (픽셀) 가져오기
   */
  getResolution(): [number, number] {
    return [this.canvas.width, this.canvas.height];
  }

  /**
   * GPU 정보 가져오기
   */
  getGPUInfo(): ReturnType<typeof getGPUInfo> {
    return getGPUInfo(this.gl);
  }

  /**
   * 컨텍스트 손실 체크
   */
  isContextLost(): boolean {
    return this.gl.isContextLost();
  }

  /**
   * 정리
   */
  destroy(): void {
    this.shaderManager.destroy();
    this.bufferManager.destroy();
  }
}
