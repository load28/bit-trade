/**
 * BitChart - Volume Series
 * GPU Instanced Rendering을 사용한 볼륨 바 차트
 */

import type { WebGLRenderer } from '../webgl/WebGLRenderer';
import type { Viewport } from '../types/data';
import type { VolumeStyle } from '../types/chart';
import { BaseSeries, type BaseSeriesOptions } from './BaseSeries';
import { InstancedRenderer } from '../webgl/InstancedRenderer';
import { createVolumeGeometry } from '../webgl/shaders/volume';

/** 볼륨 시리즈 옵션 */
export interface VolumeSeriesOptions extends BaseSeriesOptions {
  /** 볼륨 스타일 */
  style?: Partial<VolumeStyle>;
  /** 볼륨 차트 기본 Y 위치 (0-1) */
  baseY?: number;
  /** 볼륨 차트 높이 (0-1) */
  height?: number;
}

/**
 * Volume Series 클래스
 * Instanced Rendering으로 대량의 볼륨 바를 효율적으로 렌더링
 */
export class VolumeSeries extends BaseSeries {
  private instancedRenderer: InstancedRenderer;
  private style: VolumeStyle;
  private baseY: number;
  private height: number;
  private isInitialized: boolean = false;

  constructor(renderer: WebGLRenderer, options: VolumeSeriesOptions = {}) {
    super(renderer, 'volume', options);

    this.style = {
      widthRatio: 0.8,
      opacity: 0.5,
      ...options.style,
    };

    this.baseY = options.baseY ?? 0;
    this.height = options.height ?? 0.2;

    // Instanced Renderer 설정
    this.instancedRenderer = new InstancedRenderer(renderer, {
      verticesPerInstance: 6, // 볼륨 바당 6 vertices (1 사각형 = 2 triangles)
      geometryBufferId: `${this.id}_geometry`,
      instanceBufferId: `${this.id}_instances`,
      vaoId: `${this.id}_vao`,
    });
  }

  /**
   * 초기화
   */
  initialize(): void {
    if (this.isInitialized) return;

    // 볼륨 바 지오메트리 생성
    const geometry = createVolumeGeometry();

    // 지오메트리 설정 (볼륨은 vertexTypes 없음)
    this.instancedRenderer.setupGeometry(geometry.positions);

    // 볼륨용 인스턴스 속성 설정
    this.instancedRenderer.setupVolumeInstanceAttributes();

    this.isInitialized = true;
  }

  /**
   * 데이터 설정 오버라이드
   */
  setData(data: import('../types/data').OHLCV[]): void {
    super.setData(data);

    // 인스턴스 데이터 업데이트
    if (this.isInitialized) {
      this.instancedRenderer.updateInstanceData(this.dataBuffer, 6);
      this.instancedRenderer.setupVolumeInstanceAttributes();
    }
  }

  /**
   * 렌더링
   */
  render(viewport: Viewport): void {
    if (!this.visible || !this.isInitialized || this.data.length === 0) return;

    const gl = this.gl;
    const shaderManager = this.renderer.getShaderManager();

    // 셰이더 프로그램 사용
    const programInfo = shaderManager.useProgram('volume');
    if (!programInfo) return;

    // 데이터가 변경되었으면 업데이트
    if (this.isDirty) {
      this.instancedRenderer.updateInstanceData(this.dataBuffer, 6);
      this.instancedRenderer.setupVolumeInstanceAttributes();
      this.clearDirty();
    }

    // Uniforms 설정
    const { uniformLocations } = programInfo;

    // 행렬
    gl.uniformMatrix4fv(
      uniformLocations['u_projection'],
      false,
      this.renderer.getProjectionMatrix()
    );
    gl.uniformMatrix4fv(
      uniformLocations['u_view'],
      false,
      this.renderer.getViewMatrix()
    );

    // 시간 범위
    const timeRange = viewport.timeRange;
    const candleCount = this.data.length;
    const candleWidth = candleCount > 0
      ? (1 / candleCount) * this.style.widthRatio
      : 0.01;

    gl.uniform4f(
      uniformLocations['u_timeRange'],
      timeRange.from,
      timeRange.to,
      candleWidth,
      0
    );

    // 볼륨 범위 (minVolume, maxVolume, baseY, height)
    const volumeRange = viewport.volumeRange;
    gl.uniform4f(
      uniformLocations['u_volumeRange'],
      volumeRange.min,
      volumeRange.max,
      this.baseY,
      this.height
    );

    // 색상
    gl.uniform4fv(uniformLocations['u_upColor'], this.renderer.getUpColor());
    gl.uniform4fv(uniformLocations['u_downColor'], this.renderer.getDownColor());

    // 투명도
    gl.uniform1f(uniformLocations['u_opacity'], this.style.opacity);

    // 블렌딩 활성화
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    // Instanced 렌더링
    this.instancedRenderer.render();
  }

  /**
   * 스타일 설정
   */
  setStyle(style: Partial<VolumeStyle>): void {
    this.style = { ...this.style, ...style };
    this.isDirty = true;
  }

  /**
   * 스타일 가져오기
   */
  getStyle(): VolumeStyle {
    return { ...this.style };
  }

  /**
   * 위치 설정
   */
  setPosition(baseY: number, height: number): void {
    this.baseY = baseY;
    this.height = height;
  }

  /**
   * 정리
   */
  destroy(): void {
    this.instancedRenderer.destroy();
    this.isInitialized = false;
  }
}
