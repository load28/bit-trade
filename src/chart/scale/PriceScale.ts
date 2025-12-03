/**
 * BitChart - Price Scale
 * 가격축 스케일 변환 및 관리
 */

import type { PriceRange } from '../types/data';
import { calculateNiceTicks, clamp } from '../utils/math';

/** 가격 스케일 옵션 */
export interface PriceScaleOptions {
  /** 최소 가격 */
  minPrice?: number;
  /** 최대 가격 */
  maxPrice?: number;
  /** 자동 스케일 */
  autoScale?: boolean;
  /** 패딩 (0-1) */
  padding?: number;
  /** 로그 스케일 사용 */
  logScale?: boolean;
  /** 반전 (위가 작은 값) */
  inverted?: boolean;
}

/**
 * Price Scale 클래스
 * 가격 데이터와 픽셀 좌표 간의 변환을 담당
 */
export class PriceScale {
  private minPrice: number = 0;
  private maxPrice: number = 1;
  private visibleMinPrice: number = 0;
  private visibleMaxPrice: number = 1;
  private height: number = 0;
  private padding: number = 0.1;
  private autoScale: boolean = true;
  private logScale: boolean = false;
  private inverted: boolean = false;

  constructor(options: PriceScaleOptions = {}) {
    this.minPrice = options.minPrice ?? 0;
    this.maxPrice = options.maxPrice ?? 1;
    this.visibleMinPrice = this.minPrice;
    this.visibleMaxPrice = this.maxPrice;
    this.padding = options.padding ?? 0.1;
    this.autoScale = options.autoScale ?? true;
    this.logScale = options.logScale ?? false;
    this.inverted = options.inverted ?? false;
  }

  /**
   * 데이터 범위 설정
   */
  setDataRange(minPrice: number, maxPrice: number): void {
    this.minPrice = minPrice;
    this.maxPrice = maxPrice;

    if (this.autoScale) {
      this.fitContent();
    }
  }

  /**
   * 보이는 범위 설정
   */
  setVisibleRange(min: number, max: number): void {
    this.visibleMinPrice = min;
    this.visibleMaxPrice = max;
  }

  /**
   * 높이 설정 (픽셀)
   */
  setHeight(height: number): void {
    this.height = height;
  }

  /**
   * 자동 스케일 설정
   */
  setAutoScale(autoScale: boolean): void {
    this.autoScale = autoScale;
    if (autoScale) {
      this.fitContent();
    }
  }

  /**
   * 로그 스케일 설정
   */
  setLogScale(logScale: boolean): void {
    this.logScale = logScale;
  }

  /**
   * 가격 → 정규화 좌표 (0-1)
   */
  priceToNormalized(price: number): number {
    if (this.visibleMaxPrice === this.visibleMinPrice) return 0.5;

    let normalized: number;

    if (this.logScale && this.visibleMinPrice > 0) {
      const logMin = Math.log10(this.visibleMinPrice);
      const logMax = Math.log10(this.visibleMaxPrice);
      const logPrice = Math.log10(Math.max(price, this.visibleMinPrice));
      normalized = (logPrice - logMin) / (logMax - logMin);
    } else {
      normalized = (price - this.visibleMinPrice) / (this.visibleMaxPrice - this.visibleMinPrice);
    }

    // Y축은 위가 높은 값이므로 반전
    return this.inverted ? normalized : 1 - normalized;
  }

  /**
   * 정규화 좌표 (0-1) → 가격
   */
  normalizedToPrice(normalized: number): number {
    // 반전 복원
    const n = this.inverted ? normalized : 1 - normalized;

    if (this.logScale && this.visibleMinPrice > 0) {
      const logMin = Math.log10(this.visibleMinPrice);
      const logMax = Math.log10(this.visibleMaxPrice);
      return Math.pow(10, logMin + n * (logMax - logMin));
    }

    return this.visibleMinPrice + n * (this.visibleMaxPrice - this.visibleMinPrice);
  }

  /**
   * 가격 → 픽셀 좌표
   */
  priceToPixel(price: number): number {
    return this.priceToNormalized(price) * this.height;
  }

  /**
   * 픽셀 좌표 → 가격
   */
  pixelToPrice(pixel: number): number {
    const normalized = pixel / this.height;
    return this.normalizedToPrice(normalized);
  }

  /**
   * 보이는 가격 범위 가져오기
   */
  getVisibleRange(): PriceRange {
    return {
      min: this.visibleMinPrice,
      max: this.visibleMaxPrice,
    };
  }

  /**
   * 데이터 전체 가격 범위 가져오기
   */
  getDataRange(): PriceRange {
    return {
      min: this.minPrice,
      max: this.maxPrice,
    };
  }

  /**
   * 보이는 가격 범위 (차이)
   */
  getVisibleSpan(): number {
    return this.visibleMaxPrice - this.visibleMinPrice;
  }

  /**
   * 줌 (배율 변경)
   */
  zoom(factor: number, centerPrice?: number): void {
    const center = centerPrice ?? (this.visibleMinPrice + this.visibleMaxPrice) / 2;
    const lowerSpan = center - this.visibleMinPrice;
    const upperSpan = this.visibleMaxPrice - center;

    this.visibleMinPrice = center - lowerSpan * factor;
    this.visibleMaxPrice = center + upperSpan * factor;

    // 유효 범위 제한
    this.clampVisibleRange();
  }

  /**
   * 패닝 (가격 이동)
   */
  pan(deltaPrice: number): void {
    this.visibleMinPrice += deltaPrice;
    this.visibleMaxPrice += deltaPrice;
    this.clampVisibleRange();
  }

  /**
   * 픽셀 단위 패닝
   */
  panByPixels(deltaPixel: number): void {
    // Y축은 위가 낮은 값이므로 방향 반전
    const deltaPrice = (deltaPixel / this.height) * this.getVisibleSpan();
    this.pan(this.inverted ? deltaPrice : -deltaPrice);
  }

  /**
   * 보이는 범위 제한
   */
  private clampVisibleRange(): void {
    const span = this.visibleMaxPrice - this.visibleMinPrice;

    // 최소 범위 제한
    const minSpan = (this.maxPrice - this.minPrice) * 0.001;
    if (span < minSpan) {
      const center = (this.visibleMinPrice + this.visibleMaxPrice) / 2;
      this.visibleMinPrice = center - minSpan / 2;
      this.visibleMaxPrice = center + minSpan / 2;
    }

    // 음수 가격 방지 (로그 스케일용)
    if (this.logScale && this.visibleMinPrice <= 0) {
      this.visibleMinPrice = 0.0001;
    }
  }

  /**
   * 전체 데이터에 맞춤 (패딩 포함)
   */
  fitContent(): void {
    const range = this.maxPrice - this.minPrice;
    const paddingAmount = range * this.padding;

    this.visibleMinPrice = this.minPrice - paddingAmount;
    this.visibleMaxPrice = this.maxPrice + paddingAmount;

    // 음수 방지
    if (this.visibleMinPrice < 0 && this.minPrice >= 0) {
      this.visibleMinPrice = 0;
    }
  }

  /**
   * 특정 가격 범위에 맞춤
   */
  fitToRange(min: number, max: number): void {
    const range = max - min;
    const paddingAmount = range * this.padding;

    this.visibleMinPrice = min - paddingAmount;
    this.visibleMaxPrice = max + paddingAmount;

    if (this.visibleMinPrice < 0 && min >= 0) {
      this.visibleMinPrice = 0;
    }
  }

  /**
   * 그리드 라인 가격 계산
   */
  getGridPrices(targetCount: number = 5): number[] {
    return calculateNiceTicks(this.visibleMinPrice, this.visibleMaxPrice, targetCount);
  }

  /**
   * 가격이 보이는 범위 내에 있는지 확인
   */
  isPriceVisible(price: number): boolean {
    return price >= this.visibleMinPrice && price <= this.visibleMaxPrice;
  }
}
