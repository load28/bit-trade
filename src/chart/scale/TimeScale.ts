/**
 * BitChart - Time Scale
 * 시간축 스케일 변환 및 관리
 */

import type { TimeRange } from '../types/data';
import { calculateNiceTimeStep, lowerBound, upperBound } from '../utils/math';

/** 시간 스케일 옵션 */
export interface TimeScaleOptions {
  /** 최소 시간 */
  minTime?: number;
  /** 최대 시간 */
  maxTime?: number;
  /** 패딩 (0-1) */
  rightPadding?: number;
  /** 최소 바 간격 (픽셀) */
  minBarSpacing?: number;
  /** 최대 바 간격 (픽셀) */
  maxBarSpacing?: number;
}

/**
 * Time Scale 클래스
 * 시간 데이터와 픽셀 좌표 간의 변환을 담당
 */
export class TimeScale {
  private minTime: number = 0;
  private maxTime: number = 1;
  private visibleMinTime: number = 0;
  private visibleMaxTime: number = 1;
  private width: number = 0;
  private rightPadding: number = 0.05;
  private minBarSpacing: number = 2;
  private maxBarSpacing: number = 50;
  private barSpacing: number = 10;
  private timestamps: number[] = [];

  constructor(options: TimeScaleOptions = {}) {
    this.minTime = options.minTime ?? 0;
    this.maxTime = options.maxTime ?? 1;
    this.visibleMinTime = this.minTime;
    this.visibleMaxTime = this.maxTime;
    this.rightPadding = options.rightPadding ?? 0.05;
    this.minBarSpacing = options.minBarSpacing ?? 2;
    this.maxBarSpacing = options.maxBarSpacing ?? 50;
  }

  /**
   * 스케일 업데이트
   */
  setDataRange(minTime: number, maxTime: number): void {
    this.minTime = minTime;
    this.maxTime = maxTime;
  }

  /**
   * 보이는 범위 설정
   */
  setVisibleRange(from: number, to: number): void {
    this.visibleMinTime = from;
    this.visibleMaxTime = to;
  }

  /**
   * 너비 설정 (픽셀)
   */
  setWidth(width: number): void {
    this.width = width;
  }

  /**
   * 타임스탬프 배열 설정 (정렬된 상태)
   */
  setTimestamps(timestamps: number[]): void {
    this.timestamps = timestamps;
  }

  /**
   * 시간 → 정규화 좌표 (0-1)
   */
  timeToNormalized(time: number): number {
    if (this.visibleMaxTime === this.visibleMinTime) return 0.5;
    return (time - this.visibleMinTime) / (this.visibleMaxTime - this.visibleMinTime);
  }

  /**
   * 정규화 좌표 (0-1) → 시간
   */
  normalizedToTime(normalized: number): number {
    return this.visibleMinTime + normalized * (this.visibleMaxTime - this.visibleMinTime);
  }

  /**
   * 시간 → 픽셀 좌표
   */
  timeToPixel(time: number): number {
    return this.timeToNormalized(time) * this.width;
  }

  /**
   * 픽셀 좌표 → 시간
   */
  pixelToTime(pixel: number): number {
    const normalized = pixel / this.width;
    return this.normalizedToTime(normalized);
  }

  /**
   * 보이는 시간 범위 가져오기
   */
  getVisibleRange(): TimeRange {
    return {
      from: this.visibleMinTime,
      to: this.visibleMaxTime,
    };
  }

  /**
   * 데이터 전체 시간 범위 가져오기
   */
  getDataRange(): TimeRange {
    return {
      from: this.minTime,
      to: this.maxTime,
    };
  }

  /**
   * 보이는 시간 범위 (밀리초)
   */
  getVisibleDuration(): number {
    return this.visibleMaxTime - this.visibleMinTime;
  }

  /**
   * 줌 (배율 변경)
   * @param factor - 줌 팩터 (< 1: 줌 인, > 1: 줌 아웃)
   * @param centerTime - 줌 중심 시간
   */
  zoom(factor: number, centerTime?: number): void {
    const center = centerTime ?? (this.visibleMinTime + this.visibleMaxTime) / 2;
    const leftDuration = center - this.visibleMinTime;
    const rightDuration = this.visibleMaxTime - center;

    this.visibleMinTime = center - leftDuration * factor;
    this.visibleMaxTime = center + rightDuration * factor;

    // 데이터 범위를 벗어나지 않도록 제한
    this.clampVisibleRange();
  }

  /**
   * 패닝 (시간 이동)
   * @param deltaTime - 이동할 시간 (밀리초)
   */
  pan(deltaTime: number): void {
    this.visibleMinTime += deltaTime;
    this.visibleMaxTime += deltaTime;

    // 데이터 범위를 벗어나지 않도록 제한
    this.clampVisibleRange();
  }

  /**
   * 픽셀 단위 패닝
   * @param deltaPixel - 이동할 픽셀
   */
  panByPixels(deltaPixel: number): void {
    const deltaTime = (deltaPixel / this.width) * this.getVisibleDuration();
    this.pan(deltaTime);
  }

  /**
   * 보이는 범위를 데이터 범위 내로 제한
   */
  private clampVisibleRange(): void {
    const duration = this.visibleMaxTime - this.visibleMinTime;
    const dataDuration = this.maxTime - this.minTime;

    // 최소 범위 제한
    const minDuration = Math.min(dataDuration * 0.01, 60000); // 최소 1%이거나 1분
    if (duration < minDuration) {
      const center = (this.visibleMinTime + this.visibleMaxTime) / 2;
      this.visibleMinTime = center - minDuration / 2;
      this.visibleMaxTime = center + minDuration / 2;
    }

    // 왼쪽 경계
    if (this.visibleMinTime < this.minTime) {
      this.visibleMaxTime += this.minTime - this.visibleMinTime;
      this.visibleMinTime = this.minTime;
    }

    // 오른쪽 경계 (패딩 포함)
    const paddedMaxTime = this.maxTime + dataDuration * this.rightPadding;
    if (this.visibleMaxTime > paddedMaxTime) {
      this.visibleMinTime -= this.visibleMaxTime - paddedMaxTime;
      this.visibleMaxTime = paddedMaxTime;
    }
  }

  /**
   * 전체 데이터에 맞춤
   */
  fitContent(): void {
    this.visibleMinTime = this.minTime;
    this.visibleMaxTime = this.maxTime + (this.maxTime - this.minTime) * this.rightPadding;
  }

  /**
   * 가장 최근 데이터로 스크롤
   */
  scrollToEnd(): void {
    const duration = this.getVisibleDuration();
    this.visibleMaxTime = this.maxTime + (this.maxTime - this.minTime) * this.rightPadding;
    this.visibleMinTime = this.visibleMaxTime - duration;
  }

  /**
   * 시간에서 가장 가까운 바 인덱스 찾기
   */
  getBarIndexAtTime(time: number): number {
    if (this.timestamps.length === 0) return -1;

    const index = lowerBound(this.timestamps, time);
    if (index >= this.timestamps.length) return this.timestamps.length - 1;
    if (index === 0) return 0;

    // 가장 가까운 인덱스 선택
    const prevDiff = Math.abs(time - this.timestamps[index - 1]);
    const currDiff = Math.abs(time - this.timestamps[index]);
    return prevDiff < currDiff ? index - 1 : index;
  }

  /**
   * 보이는 바 인덱스 범위 가져오기
   */
  getVisibleBarRange(): { startIndex: number; endIndex: number } {
    if (this.timestamps.length === 0) {
      return { startIndex: 0, endIndex: 0 };
    }

    const startIndex = Math.max(0, lowerBound(this.timestamps, this.visibleMinTime) - 1);
    const endIndex = Math.min(
      this.timestamps.length,
      upperBound(this.timestamps, this.visibleMaxTime) + 1
    );

    return { startIndex, endIndex };
  }

  /**
   * 그리드 라인 시간 계산
   */
  getGridTimes(targetCount: number = 5): number[] {
    const duration = this.getVisibleDuration();
    const step = calculateNiceTimeStep(duration, targetCount);
    const start = Math.ceil(this.visibleMinTime / step) * step;
    const times: number[] = [];

    for (let t = start; t <= this.visibleMaxTime; t += step) {
      times.push(t);
    }

    return times;
  }

  /**
   * 바 간격 (픽셀) 계산
   */
  getBarSpacing(): number {
    if (this.timestamps.length < 2) return this.barSpacing;

    const barCount = this.getVisibleBarRange().endIndex - this.getVisibleBarRange().startIndex;
    if (barCount <= 0) return this.barSpacing;

    return Math.min(
      Math.max(this.width / barCount, this.minBarSpacing),
      this.maxBarSpacing
    );
  }
}
