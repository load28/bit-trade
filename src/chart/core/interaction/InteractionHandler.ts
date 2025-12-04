/**
 * BitChart - Interaction Handler
 * 사용자 인터랙션 처리 (포인터, 터치, 휠 이벤트)
 */

import type { TimeScale } from '../../scale/TimeScale';
import type { PriceScale } from '../../scale/PriceScale';

/** 인터랙션 이벤트 타입 */
export interface InteractionEvent {
  type: 'pan' | 'zoom' | 'crosshair' | 'click' | 'reset';
  data?: unknown;
}

/** 인터랙션 이벤트 리스너 */
export type InteractionEventListener = (event: InteractionEvent) => void;

/** 크로스헤어 위치 */
export interface CrosshairPosition {
  x: number;
  y: number;
}

/**
 * Interaction Handler 클래스
 * 차트의 모든 사용자 인터랙션 처리
 */
export class InteractionHandler {
  private canvas: HTMLCanvasElement;
  private timeScale: TimeScale;
  private priceScale: PriceScale;
  private listeners: Set<InteractionEventListener> = new Set();

  // 인터랙션 상태
  private isPanning = false;
  private lastPointerX = 0;
  private lastPointerY = 0;
  private crosshairPosition: CrosshairPosition | null = null;
  private touchStartDistance = 0;

  constructor(
    canvas: HTMLCanvasElement,
    timeScale: TimeScale,
    priceScale: PriceScale
  ) {
    this.canvas = canvas;
    this.timeScale = timeScale;
    this.priceScale = priceScale;
  }

  /**
   * 이벤트 리스너 설정
   */
  setupEventListeners(): void {
    // 포인터 이벤트
    this.canvas.addEventListener('pointerdown', this.handlePointerDown);
    this.canvas.addEventListener('pointermove', this.handlePointerMove);
    this.canvas.addEventListener('pointerup', this.handlePointerUp);
    this.canvas.addEventListener('pointerleave', this.handlePointerLeave);

    // 휠 이벤트 (줌)
    this.canvas.addEventListener('wheel', this.handleWheel, { passive: false });

    // 터치 이벤트 (핀치 줌)
    this.canvas.addEventListener('touchstart', this.handleTouchStart, { passive: false });
    this.canvas.addEventListener('touchmove', this.handleTouchMove, { passive: false });
    this.canvas.addEventListener('touchend', this.handleTouchEnd);

    // 더블클릭 (리셋)
    this.canvas.addEventListener('dblclick', this.handleDoubleClick);
  }

  /**
   * 이벤트 리스너 제거
   */
  removeEventListeners(): void {
    this.canvas.removeEventListener('pointerdown', this.handlePointerDown);
    this.canvas.removeEventListener('pointermove', this.handlePointerMove);
    this.canvas.removeEventListener('pointerup', this.handlePointerUp);
    this.canvas.removeEventListener('pointerleave', this.handlePointerLeave);
    this.canvas.removeEventListener('wheel', this.handleWheel);
    this.canvas.removeEventListener('touchstart', this.handleTouchStart);
    this.canvas.removeEventListener('touchmove', this.handleTouchMove);
    this.canvas.removeEventListener('touchend', this.handleTouchEnd);
    this.canvas.removeEventListener('dblclick', this.handleDoubleClick);
  }

  /**
   * 크로스헤어 위치 가져오기
   */
  getCrosshairPosition(): CrosshairPosition | null {
    return this.crosshairPosition;
  }

  /**
   * 이벤트 리스너 등록
   */
  addEventListener(listener: InteractionEventListener): void {
    this.listeners.add(listener);
  }

  /**
   * 이벤트 리스너 제거
   */
  removeEventListener(listener: InteractionEventListener): void {
    this.listeners.delete(listener);
  }

  /**
   * 리스너 알림
   */
  private notifyListeners(event: InteractionEvent): void {
    this.listeners.forEach((listener) => {
      try {
        listener(event);
      } catch (e) {
        console.error('Interaction event listener error:', e);
      }
    });
  }

  // ============================================
  // 이벤트 핸들러 (화살표 함수로 this 바인딩)
  // ============================================

  private handlePointerDown = (event: PointerEvent): void => {
    this.isPanning = true;
    this.lastPointerX = event.clientX;
    this.lastPointerY = event.clientY;
    this.canvas.setPointerCapture(event.pointerId);
  };

  private handlePointerMove = (event: PointerEvent): void => {
    const rect = this.canvas.getBoundingClientRect();
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

      this.notifyListeners({ type: 'pan' });
    } else {
      // 크로스헤어 업데이트
      this.crosshairPosition = { x, y };
      this.notifyListeners({
        type: 'crosshair',
        data: { x, y },
      });
    }
  };

  private handlePointerUp = (event: PointerEvent): void => {
    this.isPanning = false;
    this.canvas.releasePointerCapture(event.pointerId);
  };

  private handlePointerLeave = (): void => {
    this.crosshairPosition = null;
    this.notifyListeners({ type: 'crosshair', data: null });
  };

  private handleWheel = (event: WheelEvent): void => {
    event.preventDefault();

    const rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const normalizedX = x / rect.width;
    const centerTime = this.timeScale.normalizedToTime(normalizedX);

    // 줌 팩터 계산
    const factor = event.deltaY > 0 ? 1.1 : 0.9;
    this.timeScale.zoom(factor, centerTime);

    this.notifyListeners({ type: 'zoom' });
  };

  private handleTouchStart = (event: TouchEvent): void => {
    if (event.touches.length === 2) {
      event.preventDefault();
      const dx = event.touches[0].clientX - event.touches[1].clientX;
      const dy = event.touches[0].clientY - event.touches[1].clientY;
      this.touchStartDistance = Math.sqrt(dx * dx + dy * dy);
    }
  };

  private handleTouchMove = (event: TouchEvent): void => {
    if (event.touches.length === 2) {
      event.preventDefault();
      const dx = event.touches[0].clientX - event.touches[1].clientX;
      const dy = event.touches[0].clientY - event.touches[1].clientY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      const factor = this.touchStartDistance / distance;
      this.timeScale.zoom(factor);
      this.touchStartDistance = distance;

      this.notifyListeners({ type: 'zoom' });
    }
  };

  private handleTouchEnd = (): void => {
    this.touchStartDistance = 0;
  };

  private handleDoubleClick = (): void => {
    // 전체 보기로 리셋
    this.timeScale.fitContent();
    this.priceScale.fitContent();
    this.notifyListeners({ type: 'reset' });
  };

  /**
   * 정리
   */
  destroy(): void {
    this.removeEventListeners();
    this.listeners.clear();
  }
}
