/**
 * BitChart - Frustum Culling
 * 뷰포트 기반 렌더링 최적화
 *
 * 화면에 보이는 데이터만 GPU에 전송하여 성능 극대화
 */

import type { OHLCV, TimeRange, Viewport } from '../types/data';
import { lowerBound, upperBound } from '../utils/math';

/** 컬링 결과 */
export interface CullingResult {
  /** 시작 인덱스 */
  startIndex: number;
  /** 끝 인덱스 (exclusive) */
  endIndex: number;
  /** 보이는 데이터 개수 */
  visibleCount: number;
  /** 전체 데이터 개수 */
  totalCount: number;
  /** 컬링률 (0-1) */
  cullingRatio: number;
}

/** 컬링 옵션 */
export interface CullingOptions {
  /** 뷰포트 외부 여유 영역 (캔들 개수) */
  padding?: number;
  /** 최소 렌더링 개수 */
  minCount?: number;
  /** 최대 렌더링 개수 */
  maxCount?: number;
}

/**
 * Frustum Culler 클래스
 * 뷰포트에 보이는 데이터만 선별
 */
export class FrustumCuller {
  private options: Required<CullingOptions>;

  constructor(options: CullingOptions = {}) {
    this.options = {
      padding: options.padding ?? 5,
      minCount: options.minCount ?? 10,
      maxCount: options.maxCount ?? 100000,
    };
  }

  /**
   * 뷰포트에 보이는 데이터 인덱스 범위 계산
   */
  cull(data: OHLCV[], timeRange: TimeRange): CullingResult {
    const totalCount = data.length;

    if (totalCount === 0) {
      return {
        startIndex: 0,
        endIndex: 0,
        visibleCount: 0,
        totalCount: 0,
        cullingRatio: 1,
      };
    }

    // 시간 배열 추출
    const times = data.map((d) => d.time);

    // Binary search로 시작/끝 인덱스 찾기
    let startIndex = lowerBound(times, timeRange.from);
    let endIndex = upperBound(times, timeRange.to);

    // 패딩 적용
    startIndex = Math.max(0, startIndex - this.options.padding);
    endIndex = Math.min(totalCount, endIndex + this.options.padding);

    // 최소/최대 개수 제한
    let visibleCount = endIndex - startIndex;

    if (visibleCount < this.options.minCount) {
      const diff = this.options.minCount - visibleCount;
      const halfDiff = Math.floor(diff / 2);
      startIndex = Math.max(0, startIndex - halfDiff);
      endIndex = Math.min(totalCount, endIndex + (diff - halfDiff));
      visibleCount = endIndex - startIndex;
    }

    if (visibleCount > this.options.maxCount) {
      // 중앙 기준으로 자르기
      const center = Math.floor((startIndex + endIndex) / 2);
      const halfMax = Math.floor(this.options.maxCount / 2);
      startIndex = Math.max(0, center - halfMax);
      endIndex = Math.min(totalCount, startIndex + this.options.maxCount);
      visibleCount = endIndex - startIndex;
    }

    const cullingRatio = totalCount > 0 ? 1 - visibleCount / totalCount : 1;

    return {
      startIndex,
      endIndex,
      visibleCount,
      totalCount,
      cullingRatio,
    };
  }

  /**
   * Float32Array에서 보이는 데이터만 추출
   */
  cullBuffer(
    buffer: Float32Array,
    floatsPerItem: number,
    timeRange: TimeRange,
    timeOffset: number = 0
  ): { data: Float32Array; startIndex: number; count: number } {
    const totalCount = buffer.length / floatsPerItem;

    if (totalCount === 0) {
      return { data: new Float32Array(0), startIndex: 0, count: 0 };
    }

    // 시간 배열 생성
    const times: number[] = [];
    for (let i = 0; i < totalCount; i++) {
      times.push(buffer[i * floatsPerItem + timeOffset]);
    }

    // 인덱스 범위 계산
    let startIndex = lowerBound(times, timeRange.from);
    let endIndex = upperBound(times, timeRange.to);

    // 패딩 적용
    startIndex = Math.max(0, startIndex - this.options.padding);
    endIndex = Math.min(totalCount, endIndex + this.options.padding);

    // 최대 개수 제한
    if (endIndex - startIndex > this.options.maxCount) {
      const center = Math.floor((startIndex + endIndex) / 2);
      const halfMax = Math.floor(this.options.maxCount / 2);
      startIndex = Math.max(0, center - halfMax);
      endIndex = Math.min(totalCount, startIndex + this.options.maxCount);
    }

    const count = endIndex - startIndex;
    const byteOffset = startIndex * floatsPerItem;
    const byteLength = count * floatsPerItem;

    // subarray는 복사 없이 뷰 반환
    const data = buffer.subarray(byteOffset, byteOffset + byteLength);

    return { data, startIndex, count };
  }

  /**
   * 뷰포트 변경 시 렌더링이 필요한지 확인
   */
  needsUpdate(
    prevRange: TimeRange | null,
    newRange: TimeRange,
    threshold: number = 0.1
  ): boolean {
    if (!prevRange) return true;

    const prevWidth = prevRange.to - prevRange.from;
    const newWidth = newRange.to - newRange.from;

    // 줌 레벨 변경
    if (Math.abs(prevWidth - newWidth) / prevWidth > threshold) {
      return true;
    }

    // 패닝
    const panAmount = Math.abs(newRange.from - prevRange.from) / prevWidth;
    if (panAmount > threshold) {
      return true;
    }

    return false;
  }
}

/**
 * 빠른 뷰포트 체크 유틸리티
 */
export function isInViewport(
  time: number,
  timeRange: TimeRange,
  padding: number = 0
): boolean {
  const paddedFrom = timeRange.from - padding;
  const paddedTo = timeRange.to + padding;
  return time >= paddedFrom && time <= paddedTo;
}

/**
 * 데이터 범위가 뷰포트와 교차하는지 확인
 */
export function intersectsViewport(
  dataStart: number,
  dataEnd: number,
  viewportStart: number,
  viewportEnd: number
): boolean {
  return dataStart <= viewportEnd && dataEnd >= viewportStart;
}
