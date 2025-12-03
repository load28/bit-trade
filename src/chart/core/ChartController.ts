/**
 * BitChart - Chart Controller
 * 차트의 모든 컴포넌트를 조율하는 메인 컨트롤러
 *
 * Features:
 * - Worker 관리 (Render, Compute)
 * - 데이터 관리 (SharedArrayBuffer)
 * - 뷰포트 및 스케일 관리
 * - 사용자 인터랙션 처리
 * - 이벤트 시스템
 */

import type { OHLCV, Viewport, TimeRange, PriceRange } from '../types/data';
import type { ChartOptions, ChartColors } from '../types/chart';
import { SharedDataManager, type DataChangeEvent } from './SharedDataManager';
import { RenderWorkerBridge, ComputeWorkerBridge, type WorkerEvent } from './WorkerBridge';
import { TimeScale } from '../scale/TimeScale';
import { PriceScale } from '../scale/PriceScale';

/** 차트 이벤트 */
export interface ChartEvent {
  type:
    | 'ready'
    | 'dataChange'
    | 'viewportChange'
    | 'crosshair'
    | 'click'
    | 'error';
  data?: unknown;
  error?: Error;
}

/** 차트 이벤트 리스너 */
export type ChartEventListener = (event: ChartEvent) => void;

/** 크로스헤어 데이터 */
export interface CrosshairData {
  x: number;
  y: number;
  time: number;
  price: number;
  candle?: OHLCV;
}

/** 기본 차트 옵션 */
const DEFAULT_OPTIONS: ChartOptions = {
  width: 800,
  height: 600,
  autoResize: true,
  theme: 'light',
  layout: {
    padding: { top: 20, right: 80, bottom: 30, left: 10 },
    volumeHeight: 0.2,
    showVolume: true,
  },
};

/**
 * Chart Controller 클래스
 * 차트의 메인 진입점
 */
export class ChartController {
  // DOM 요소
  private container: HTMLElement | null = null;
  private mainCanvas: HTMLCanvasElement | null = null;
  private uiCanvas: HTMLCanvasElement | null = null;

  // Worker Bridges
  private renderBridge: RenderWorkerBridge | null = null;
  private computeBridge: ComputeWorkerBridge | null = null;

  // 데이터 관리
  private dataManager: SharedDataManager;

  // 스케일
  private timeScale: TimeScale;
  private priceScale: PriceScale;

  // 옵션
  private options: ChartOptions;

  // 상태
  private isInitialized = false;
  private isDestroyed = false;
  private listeners: Set<ChartEventListener> = new Set();

  // 인터랙션 상태
  private isPanning = false;
  private lastPointerX = 0;
  private lastPointerY = 0;
  private crosshairPosition: { x: number; y: number } | null = null;

  // ResizeObserver
  private resizeObserver: ResizeObserver | null = null;

  constructor(options: Partial<ChartOptions> = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };

    // 데이터 매니저 초기화
    this.dataManager = new SharedDataManager({
      initialCapacity: 10000,
      maxCapacity: 1000000,
    });

    // 스케일 초기화
    this.timeScale = new TimeScale();
    this.priceScale = new PriceScale();

    // 데이터 변경 리스너
    this.dataManager.addListener(this.handleDataChange.bind(this));
  }

  /**
   * 차트 초기화
   */
  async init(container: HTMLElement | string): Promise<void> {
    if (this.isInitialized || this.isDestroyed) {
      throw new Error('Chart already initialized or destroyed');
    }

    // 컨테이너 찾기
    if (typeof container === 'string') {
      this.container = document.getElementById(container);
    } else {
      this.container = container;
    }

    if (!this.container) {
      throw new Error('Container element not found');
    }

    // Canvas 요소 생성
    this.createCanvasElements();

    // Worker 초기화
    await this.initWorkers();

    // 이벤트 리스너 설정
    this.setupEventListeners();

    // 리사이즈 옵저버 설정
    if (this.options.autoResize) {
      this.setupResizeObserver();
    }

    this.isInitialized = true;

    // 초기 테마 적용
    this.setTheme(this.options.theme ?? 'light');

    // 준비 완료 이벤트
    this.notifyListeners({ type: 'ready' });
  }

  /**
   * Canvas 요소 생성
   */
  private createCanvasElements(): void {
    if (!this.container) return;

    // 기존 요소 정리
    this.container.innerHTML = '';

    // 컨테이너 스타일
    this.container.style.position = 'relative';
    this.container.style.overflow = 'hidden';

    const width = this.options.width ?? this.container.clientWidth;
    const height = this.options.height ?? this.container.clientHeight;

    // WebGL Canvas (OffscreenCanvas로 Worker에 전송됨)
    this.mainCanvas = document.createElement('canvas');
    this.mainCanvas.style.position = 'absolute';
    this.mainCanvas.style.top = '0';
    this.mainCanvas.style.left = '0';
    this.mainCanvas.style.width = '100%';
    this.mainCanvas.style.height = '100%';
    this.mainCanvas.width = width * (window.devicePixelRatio || 1);
    this.mainCanvas.height = height * (window.devicePixelRatio || 1);
    this.container.appendChild(this.mainCanvas);

    // UI Canvas (크로스헤어, 툴팁, 축 레이블)
    this.uiCanvas = document.createElement('canvas');
    this.uiCanvas.style.position = 'absolute';
    this.uiCanvas.style.top = '0';
    this.uiCanvas.style.left = '0';
    this.uiCanvas.style.width = '100%';
    this.uiCanvas.style.height = '100%';
    this.uiCanvas.style.pointerEvents = 'none'; // 이벤트는 mainCanvas에서 처리
    this.uiCanvas.width = width * (window.devicePixelRatio || 1);
    this.uiCanvas.height = height * (window.devicePixelRatio || 1);
    this.container.appendChild(this.uiCanvas);

    // 스케일 크기 설정
    this.timeScale.setWidth(width);
    this.priceScale.setHeight(height);
  }

  /**
   * Worker 초기화
   */
  private async initWorkers(): Promise<void> {
    if (!this.mainCanvas) return;

    const sharedBuffer = this.dataManager.getSharedBuffer() ?? undefined;

    // Render Worker
    this.renderBridge = new RenderWorkerBridge();
    this.renderBridge.addEventListener(this.handleWorkerEvent.bind(this));

    try {
      await this.renderBridge.init(this.mainCanvas, sharedBuffer);
    } catch (error) {
      console.warn('Render Worker initialization failed, using fallback', error);
      // Fallback: Main thread 렌더링 (구현 생략)
    }

    // Compute Worker
    this.computeBridge = new ComputeWorkerBridge();
    try {
      await this.computeBridge.init(sharedBuffer);
    } catch (error) {
      console.warn('Compute Worker initialization failed', error);
    }
  }

  /**
   * 이벤트 리스너 설정
   */
  private setupEventListeners(): void {
    if (!this.mainCanvas) return;

    // 포인터 이벤트
    this.mainCanvas.addEventListener('pointerdown', this.handlePointerDown.bind(this));
    this.mainCanvas.addEventListener('pointermove', this.handlePointerMove.bind(this));
    this.mainCanvas.addEventListener('pointerup', this.handlePointerUp.bind(this));
    this.mainCanvas.addEventListener('pointerleave', this.handlePointerLeave.bind(this));

    // 휠 이벤트 (줌)
    this.mainCanvas.addEventListener('wheel', this.handleWheel.bind(this), {
      passive: false,
    });

    // 터치 이벤트 (핀치 줌)
    this.mainCanvas.addEventListener('touchstart', this.handleTouchStart.bind(this), {
      passive: false,
    });
    this.mainCanvas.addEventListener('touchmove', this.handleTouchMove.bind(this), {
      passive: false,
    });
    this.mainCanvas.addEventListener('touchend', this.handleTouchEnd.bind(this));

    // 더블클릭 (리셋)
    this.mainCanvas.addEventListener('dblclick', this.handleDoubleClick.bind(this));
  }

  /**
   * ResizeObserver 설정
   */
  private setupResizeObserver(): void {
    if (!this.container) return;

    this.resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        this.resize(width, height);
      }
    });

    this.resizeObserver.observe(this.container);
  }

  /**
   * 데이터 설정
   */
  setData(data: OHLCV[]): void {
    this.dataManager.setData(data);

    // 스케일 업데이트
    if (data.length > 0) {
      const timestamps = data.map((d) => d.time);
      this.timeScale.setTimestamps(timestamps);
      this.timeScale.setDataRange(
        Math.min(...timestamps),
        Math.max(...timestamps)
      );
      this.timeScale.fitContent();

      const prices = data.flatMap((d) => [d.high, d.low]);
      this.priceScale.setDataRange(
        Math.min(...prices),
        Math.max(...prices)
      );
      this.priceScale.fitContent();
    }

    // Worker에 데이터 전송
    this.syncDataToWorker();

    // 뷰포트 업데이트
    this.updateViewport();
  }

  /**
   * 데이터 추가
   */
  appendData(candles: OHLCV[]): void {
    this.dataManager.appendData(candles);
  }

  /**
   * 마지막 캔들 업데이트
   */
  updateLastCandle(candle: OHLCV): void {
    this.dataManager.updateLastCandle(candle);
  }

  /**
   * Worker에 데이터 동기화
   */
  private syncDataToWorker(): void {
    if (!this.renderBridge) return;

    if (this.dataManager.isSharedBufferSupported()) {
      // SharedArrayBuffer 사용
      this.renderBridge.updateDataShared(0, this.dataManager.getDataCount());
    } else {
      // Transferable 사용
      const buffer = this.dataManager.getDataBuffer();
      if (buffer) {
        this.renderBridge.updateData(buffer);
      }
    }
  }

  /**
   * 뷰포트 업데이트
   */
  private updateViewport(): void {
    if (!this.renderBridge) return;

    const data = this.dataManager.getData();
    const visibleTimeRange = this.timeScale.getVisibleRange();
    const visiblePriceRange = this.priceScale.getVisibleRange();

    // 보이는 데이터의 볼륨 범위 계산
    let minVolume = 0;
    let maxVolume = 0;

    for (const candle of data) {
      if (candle.time >= visibleTimeRange.from && candle.time <= visibleTimeRange.to) {
        if (candle.volume > maxVolume) maxVolume = candle.volume;
      }
    }

    const viewport: Viewport = {
      timeRange: visibleTimeRange,
      priceRange: visiblePriceRange,
      volumeRange: { min: minVolume, max: maxVolume },
      width: this.options.width ?? 800,
      height: this.options.height ?? 600,
    };

    this.renderBridge.setViewport(viewport);

    // UI 레이어 다시 그리기
    this.renderUILayer();

    // 이벤트 발생
    this.notifyListeners({
      type: 'viewportChange',
      data: viewport,
    });
  }

  /**
   * UI 레이어 렌더링 (Canvas 2D)
   */
  private renderUILayer(): void {
    if (!this.uiCanvas) return;

    const ctx = this.uiCanvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = this.uiCanvas.width / dpr;
    const height = this.uiCanvas.height / dpr;

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    const layout = this.options.layout!;
    const padding = layout.padding!;

    // 축 레이블 영역
    const chartLeft = padding.left!;
    const chartTop = padding.top!;
    const chartWidth = width - padding.left! - padding.right!;
    const chartHeight = height - padding.top! - padding.bottom!;

    // Y축 (가격) 그리드 및 레이블
    this.renderPriceAxis(ctx, chartLeft + chartWidth, chartTop, chartHeight);

    // X축 (시간) 그리드 및 레이블
    this.renderTimeAxis(ctx, chartLeft, chartTop + chartHeight, chartWidth);

    // 크로스헤어
    if (this.crosshairPosition) {
      this.renderCrosshair(
        ctx,
        this.crosshairPosition.x,
        this.crosshairPosition.y,
        chartLeft,
        chartTop,
        chartWidth,
        chartHeight
      );
    }

    ctx.restore();
  }

  /**
   * 가격 축 렌더링
   */
  private renderPriceAxis(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    height: number
  ): void {
    const gridPrices = this.priceScale.getGridPrices(6);
    const theme = this.options.theme === 'dark';

    ctx.font = '11px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillStyle = theme ? '#b0b0b0' : '#666666';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    for (const price of gridPrices) {
      const py = y + this.priceScale.priceToNormalized(price) * height;

      // 그리드 라인
      ctx.strokeStyle = theme ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, py);
      ctx.lineTo(x, py);
      ctx.stroke();

      // 레이블
      ctx.fillText(this.formatPrice(price), x + 8, py);
    }
  }

  /**
   * 시간 축 렌더링
   */
  private renderTimeAxis(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number
  ): void {
    const gridTimes = this.timeScale.getGridTimes(6);
    const theme = this.options.theme === 'dark';

    ctx.font = '11px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillStyle = theme ? '#b0b0b0' : '#666666';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    for (const time of gridTimes) {
      const px = x + this.timeScale.timeToNormalized(time) * width;

      // 그리드 라인
      ctx.strokeStyle = theme ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(px, 0);
      ctx.lineTo(px, y);
      ctx.stroke();

      // 레이블
      ctx.fillText(this.formatTime(time), px, y + 8);
    }
  }

  /**
   * 크로스헤어 렌더링
   */
  private renderCrosshair(
    ctx: CanvasRenderingContext2D,
    mouseX: number,
    mouseY: number,
    chartLeft: number,
    chartTop: number,
    chartWidth: number,
    chartHeight: number
  ): void {
    const theme = this.options.theme === 'dark';

    // 차트 영역 내인지 확인
    if (
      mouseX < chartLeft ||
      mouseX > chartLeft + chartWidth ||
      mouseY < chartTop ||
      mouseY > chartTop + chartHeight
    ) {
      return;
    }

    // 수평선
    ctx.strokeStyle = theme ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.3)';
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(chartLeft, mouseY);
    ctx.lineTo(chartLeft + chartWidth, mouseY);
    ctx.stroke();

    // 수직선
    ctx.beginPath();
    ctx.moveTo(mouseX, chartTop);
    ctx.lineTo(mouseX, chartTop + chartHeight);
    ctx.stroke();
    ctx.setLineDash([]);

    // 가격 레이블
    const normalizedY = (mouseY - chartTop) / chartHeight;
    const price = this.priceScale.normalizedToPrice(normalizedY);

    ctx.fillStyle = theme ? '#2962ff' : '#2962ff';
    ctx.fillRect(chartLeft + chartWidth, mouseY - 10, 70, 20);
    ctx.fillStyle = '#ffffff';
    ctx.font = '11px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.formatPrice(price), chartLeft + chartWidth + 4, mouseY);

    // 시간 레이블
    const normalizedX = (mouseX - chartLeft) / chartWidth;
    const time = this.timeScale.normalizedToTime(normalizedX);

    const timeLabel = this.formatTime(time);
    const labelWidth = ctx.measureText(timeLabel).width + 16;

    ctx.fillStyle = theme ? '#2962ff' : '#2962ff';
    ctx.fillRect(mouseX - labelWidth / 2, chartTop + chartHeight, labelWidth, 20);
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(timeLabel, mouseX, chartTop + chartHeight + 10);
  }

  /**
   * 가격 포맷팅
   */
  private formatPrice(price: number): string {
    if (price >= 1000) {
      return price.toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      });
    }
    return price.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: price < 1 ? 6 : 2,
    });
  }

  /**
   * 시간 포맷팅
   */
  private formatTime(timestamp: number): string {
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  /**
   * 리사이즈
   */
  resize(width: number, height: number): void {
    this.options.width = width;
    this.options.height = height;

    // 스케일 업데이트
    this.timeScale.setWidth(width);
    this.priceScale.setHeight(height);

    // Canvas 크기 업데이트
    const dpr = window.devicePixelRatio || 1;

    if (this.mainCanvas) {
      this.mainCanvas.width = width * dpr;
      this.mainCanvas.height = height * dpr;
    }

    if (this.uiCanvas) {
      this.uiCanvas.width = width * dpr;
      this.uiCanvas.height = height * dpr;
    }

    // Worker에 알림
    this.renderBridge?.resize(width, height);

    // 뷰포트 업데이트
    this.updateViewport();
  }

  /**
   * 테마 설정
   */
  setTheme(theme: 'light' | 'dark'): void {
    this.options.theme = theme;
    this.renderBridge?.setTheme(theme);
    this.renderUILayer();
  }

  /**
   * 지표 계산 요청
   */
  async computeIndicator(
    indicator: 'SMA' | 'EMA' | 'RSI' | 'MACD' | 'BB',
    params: Record<string, number>
  ): Promise<Float32Array> {
    if (!this.computeBridge) {
      throw new Error('Compute Worker not initialized');
    }

    return this.computeBridge.computeIndicator(
      indicator,
      params,
      0,
      this.dataManager.getDataCount()
    );
  }

  // ============================================
  // 이벤트 핸들러
  // ============================================

  private handlePointerDown(event: PointerEvent): void {
    this.isPanning = true;
    this.lastPointerX = event.clientX;
    this.lastPointerY = event.clientY;
    this.mainCanvas?.setPointerCapture(event.pointerId);
  }

  private handlePointerMove(event: PointerEvent): void {
    const rect = this.mainCanvas?.getBoundingClientRect();
    if (!rect) return;

    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    if (this.isPanning) {
      // 패닝
      const deltaX = event.clientX - this.lastPointerX;
      const deltaY = event.clientY - this.lastPointerY;

      this.timeScale.panByPixels(-deltaX);
      this.priceScale.panByPixels(deltaY);

      this.lastPointerX = event.clientX;
      this.lastPointerY = event.clientY;

      this.updateViewport();
    } else {
      // 크로스헤어 업데이트
      this.crosshairPosition = { x, y };
      this.renderUILayer();

      // 크로스헤어 이벤트
      const normalizedX = x / (this.options.width ?? 800);
      const normalizedY = y / (this.options.height ?? 600);
      const time = this.timeScale.normalizedToTime(normalizedX);
      const price = this.priceScale.normalizedToPrice(normalizedY);

      this.notifyListeners({
        type: 'crosshair',
        data: { x, y, time, price } as CrosshairData,
      });
    }
  }

  private handlePointerUp(event: PointerEvent): void {
    this.isPanning = false;
    this.mainCanvas?.releasePointerCapture(event.pointerId);
  }

  private handlePointerLeave(): void {
    this.crosshairPosition = null;
    this.renderUILayer();
  }

  private handleWheel(event: WheelEvent): void {
    event.preventDefault();

    const rect = this.mainCanvas?.getBoundingClientRect();
    if (!rect) return;

    const x = event.clientX - rect.left;
    const normalizedX = x / (this.options.width ?? 800);
    const centerTime = this.timeScale.normalizedToTime(normalizedX);

    // 줌 팩터 계산
    const factor = event.deltaY > 0 ? 1.1 : 0.9;
    this.timeScale.zoom(factor, centerTime);

    this.updateViewport();
  }

  private touchStartDistance = 0;

  private handleTouchStart(event: TouchEvent): void {
    if (event.touches.length === 2) {
      event.preventDefault();
      const dx = event.touches[0].clientX - event.touches[1].clientX;
      const dy = event.touches[0].clientY - event.touches[1].clientY;
      this.touchStartDistance = Math.sqrt(dx * dx + dy * dy);
    }
  }

  private handleTouchMove(event: TouchEvent): void {
    if (event.touches.length === 2) {
      event.preventDefault();
      const dx = event.touches[0].clientX - event.touches[1].clientX;
      const dy = event.touches[0].clientY - event.touches[1].clientY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      const factor = this.touchStartDistance / distance;
      this.timeScale.zoom(factor);
      this.touchStartDistance = distance;

      this.updateViewport();
    }
  }

  private handleTouchEnd(): void {
    this.touchStartDistance = 0;
  }

  private handleDoubleClick(): void {
    // 전체 보기로 리셋
    this.timeScale.fitContent();
    this.priceScale.fitContent();
    this.updateViewport();
  }

  private handleDataChange(event: DataChangeEvent): void {
    // Worker에 데이터 동기화
    this.syncDataToWorker();

    // 뷰포트 업데이트
    this.updateViewport();

    // 이벤트 발생
    this.notifyListeners({
      type: 'dataChange',
      data: event,
    });
  }

  private handleWorkerEvent(event: WorkerEvent): void {
    if (event.type === 'error' && event.error) {
      this.notifyListeners({
        type: 'error',
        error: event.error,
      });
    }
  }

  /**
   * 이벤트 리스너 등록
   */
  addEventListener(listener: ChartEventListener): void {
    this.listeners.add(listener);
  }

  /**
   * 이벤트 리스너 제거
   */
  removeEventListener(listener: ChartEventListener): void {
    this.listeners.delete(listener);
  }

  /**
   * 리스너 알림
   */
  private notifyListeners(event: ChartEvent): void {
    this.listeners.forEach((listener) => {
      try {
        listener(event);
      } catch (e) {
        console.error('Chart event listener error:', e);
      }
    });
  }

  /**
   * 정리
   */
  destroy(): void {
    if (this.isDestroyed) return;

    // ResizeObserver 해제
    this.resizeObserver?.disconnect();

    // Worker 종료
    this.renderBridge?.destroy();
    this.computeBridge?.destroy();

    // 데이터 매니저 정리
    this.dataManager.destroy();

    // DOM 정리
    if (this.container) {
      this.container.innerHTML = '';
    }

    this.listeners.clear();
    this.isDestroyed = true;
  }
}
