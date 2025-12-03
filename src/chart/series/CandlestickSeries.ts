/**
 * BitChart - Candlestick Series
 * GPU Instanced Rendering을 사용한 캔들스틱 차트
 */

import type { WebGLRenderer } from '../webgl/WebGLRenderer';
import type { Viewport } from '../types/data';
import type { CandlestickStyle, DEFAULT_CANDLESTICK_STYLE } from '../types/chart';
import { BaseSeries, type BaseSeriesOptions } from './BaseSeries';
import { InstancedRenderer } from '../webgl/InstancedRenderer';
import { createCandlestickGeometry } from '../webgl/shaders/candlestick';

/** 캔들스틱 시리즈 옵션 */
export interface CandlestickSeriesOptions extends BaseSeriesOptions {
  /** 캔들스틱 스타일 */
  style?: Partial<CandlestickStyle>;
}

/**
 * Candlestick Series 클래스
 * Instanced Rendering으로 대량의 캔들스틱을 효율적으로 렌더링
 */
export class CandlestickSeries extends BaseSeries {
  private instancedRenderer: InstancedRenderer;
  private style: CandlestickStyle;
  private isInitialized: boolean = false;

  constructor(renderer: WebGLRenderer, options: CandlestickSeriesOptions = {}) {
    super(renderer, 'candlestick', options);

    this.style = {
      widthRatio: 0.8,
      wickWidthRatio: 0.1,
      minWidth: 1,
      maxWidth: 50,
      ...options.style,
    };

    // Instanced Renderer 설정
    this.instancedRenderer = new InstancedRenderer(renderer, {
      verticesPerInstance: 18, // 캔들당 18 vertices (body 6 + upper wick 6 + lower wick 6)
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

    // 캔들스틱 지오메트리 생성
    const geometry = createCandlestickGeometry();

    // 지오메트리 설정
    this.instancedRenderer.setupGeometry(geometry.positions, geometry.vertexTypes);

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
    const programInfo = shaderManager.useProgram('candlestick');
    if (!programInfo) return;

    // 데이터가 변경되었으면 업데이트
    if (this.isDirty) {
      this.instancedRenderer.updateInstanceData(this.dataBuffer, 6);
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

    // 시간 범위 (minTime, maxTime, candleWidth, gap)
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
      0 // gap
    );

    // 가격 범위 (minPrice, maxPrice, padding, padding)
    const priceRange = viewport.priceRange;
    gl.uniform4f(
      uniformLocations['u_priceRange'],
      priceRange.min,
      priceRange.max,
      0,
      0
    );

    // 색상
    gl.uniform4fv(uniformLocations['u_upColor'], this.renderer.getUpColor());
    gl.uniform4fv(uniformLocations['u_downColor'], this.renderer.getDownColor());

    // 해상도
    const resolution = this.renderer.getResolution();
    gl.uniform2f(uniformLocations['u_resolution'], resolution[0], resolution[1]);

    // Instanced 렌더링
    this.instancedRenderer.render();
  }

  /**
   * 스타일 설정
   */
  setStyle(style: Partial<CandlestickStyle>): void {
    this.style = { ...this.style, ...style };
    this.isDirty = true;
  }

  /**
   * 스타일 가져오기
   */
  getStyle(): CandlestickStyle {
    return { ...this.style };
  }

  /**
   * 정리
   */
  destroy(): void {
    this.instancedRenderer.destroy();
    this.isInitialized = false;
  }
}
