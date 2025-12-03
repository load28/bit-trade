/**
 * BitChart - Base Series
 * 모든 시리즈의 기본 클래스
 */

import type { WebGLRenderer } from '../webgl/WebGLRenderer';
import type { OHLCV, Viewport } from '../types/data';
import type { SeriesOptions, SeriesType } from '../types/chart';

/** 시리즈 기본 설정 */
export interface BaseSeriesOptions extends Partial<SeriesOptions> {
  /** 시리즈 ID */
  id?: string;
}

/**
 * Base Series 추상 클래스
 */
export abstract class BaseSeries {
  protected renderer: WebGLRenderer;
  protected gl: WebGL2RenderingContext;
  protected id: string;
  protected type: SeriesType;
  protected visible: boolean = true;
  protected zIndex: number = 0;
  protected data: OHLCV[] = [];
  protected dataBuffer: Float32Array = new Float32Array(0);
  protected isDirty: boolean = false;

  constructor(renderer: WebGLRenderer, type: SeriesType, options: BaseSeriesOptions = {}) {
    this.renderer = renderer;
    this.gl = renderer.getGL();
    this.type = type;
    this.id = options.id || `${type}_${Date.now()}`;
    this.visible = options.visible ?? true;
    this.zIndex = options.zIndex ?? 0;
  }

  /**
   * 시리즈 ID
   */
  getId(): string {
    return this.id;
  }

  /**
   * 시리즈 타입
   */
  getType(): SeriesType {
    return this.type;
  }

  /**
   * 가시성 설정
   */
  setVisible(visible: boolean): void {
    this.visible = visible;
  }

  /**
   * 가시성 확인
   */
  isVisible(): boolean {
    return this.visible;
  }

  /**
   * z-index 설정
   */
  setZIndex(zIndex: number): void {
    this.zIndex = zIndex;
  }

  /**
   * z-index 가져오기
   */
  getZIndex(): number {
    return this.zIndex;
  }

  /**
   * 데이터 설정
   */
  setData(data: OHLCV[]): void {
    this.data = data;
    this.updateDataBuffer();
    this.isDirty = true;
  }

  /**
   * 데이터 가져오기
   */
  getData(): OHLCV[] {
    return this.data;
  }

  /**
   * 데이터 개수
   */
  getDataCount(): number {
    return this.data.length;
  }

  /**
   * 데이터 버퍼 업데이트
   */
  protected updateDataBuffer(): void {
    const data = this.data;
    const buffer = new Float32Array(data.length * 6);

    for (let i = 0; i < data.length; i++) {
      const candle = data[i];
      const offset = i * 6;
      buffer[offset + 0] = candle.time;
      buffer[offset + 1] = candle.open;
      buffer[offset + 2] = candle.high;
      buffer[offset + 3] = candle.low;
      buffer[offset + 4] = candle.close;
      buffer[offset + 5] = candle.volume;
    }

    this.dataBuffer = buffer;
  }

  /**
   * 데이터 버퍼 가져오기
   */
  getDataBuffer(): Float32Array {
    return this.dataBuffer;
  }

  /**
   * 실시간 데이터 업데이트 (마지막 캔들)
   */
  updateLastCandle(candle: OHLCV): void {
    if (this.data.length === 0) {
      this.data.push(candle);
    } else {
      const lastCandle = this.data[this.data.length - 1];
      if (lastCandle.time === candle.time) {
        // 기존 캔들 업데이트
        lastCandle.high = Math.max(lastCandle.high, candle.high);
        lastCandle.low = Math.min(lastCandle.low, candle.low);
        lastCandle.close = candle.close;
        lastCandle.volume = candle.volume;
      } else {
        // 새 캔들 추가
        this.data.push(candle);
      }
    }

    this.updateDataBuffer();
    this.isDirty = true;
  }

  /**
   * 새 캔들 추가
   */
  addCandle(candle: OHLCV): void {
    this.data.push(candle);
    this.updateDataBuffer();
    this.isDirty = true;
  }

  /**
   * 데이터 범위 계산
   */
  getDataRange(): {
    minTime: number;
    maxTime: number;
    minPrice: number;
    maxPrice: number;
    minVolume: number;
    maxVolume: number;
  } {
    if (this.data.length === 0) {
      return {
        minTime: 0,
        maxTime: 1,
        minPrice: 0,
        maxPrice: 1,
        minVolume: 0,
        maxVolume: 1,
      };
    }

    let minTime = this.data[0].time;
    let maxTime = this.data[0].time;
    let minPrice = this.data[0].low;
    let maxPrice = this.data[0].high;
    let minVolume = this.data[0].volume;
    let maxVolume = this.data[0].volume;

    for (const candle of this.data) {
      minTime = Math.min(minTime, candle.time);
      maxTime = Math.max(maxTime, candle.time);
      minPrice = Math.min(minPrice, candle.low);
      maxPrice = Math.max(maxPrice, candle.high);
      minVolume = Math.min(minVolume, candle.volume);
      maxVolume = Math.max(maxVolume, candle.volume);
    }

    return { minTime, maxTime, minPrice, maxPrice, minVolume, maxVolume };
  }

  /**
   * Dirty 상태 확인
   */
  getIsDirty(): boolean {
    return this.isDirty;
  }

  /**
   * Dirty 상태 초기화
   */
  clearDirty(): void {
    this.isDirty = false;
  }

  /**
   * 초기화 (서브클래스에서 구현)
   */
  abstract initialize(): void;

  /**
   * 렌더링 (서브클래스에서 구현)
   */
  abstract render(viewport: Viewport): void;

  /**
   * 정리 (서브클래스에서 구현)
   */
  abstract destroy(): void;
}
