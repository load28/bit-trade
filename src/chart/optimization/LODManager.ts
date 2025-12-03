/**
 * BitChart - LOD (Level of Detail) Manager
 * 줌 레벨에 따른 데이터 상세도 관리
 *
 * 멀리서 볼 때는 축소된 데이터, 가까이서 볼 때는 상세 데이터 사용
 */

import type { OHLCV } from '../types/data';
import { FLOATS_PER_CANDLE } from '../types/worker';

/** LOD 레벨 정의 */
export interface LODLevel {
  /** 레벨 ID */
  id: number;
  /** 이 레벨이 적용되는 최소 캔들 개수 (화면에 보이는) */
  minVisibleCount: number;
  /** 데이터 축소 비율 (1 = 원본, 2 = 절반, ...) */
  decimationFactor: number;
  /** 캐시된 데이터 */
  cachedData: Float32Array | null;
  /** 캐시 유효 여부 */
  isDirty: boolean;
}

/** LOD 매니저 옵션 */
export interface LODManagerOptions {
  /** LOD 레벨 설정 */
  levels?: Array<{ minVisibleCount: number; decimationFactor: number }>;
  /** 자동 LOD 전환 활성화 */
  autoSwitch?: boolean;
  /** 전환 히스테리시스 (%) */
  hysteresis?: number;
}

/** M4 데시메이션 결과 */
interface DecimatedBucket {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/**
 * LOD Manager 클래스
 */
export class LODManager {
  private levels: LODLevel[] = [];
  private currentLevelId = 0;
  private sourceData: OHLCV[] = [];
  private options: Required<LODManagerOptions>;

  constructor(options: LODManagerOptions = {}) {
    this.options = {
      levels: options.levels ?? [
        { minVisibleCount: 0, decimationFactor: 1 },      // LOD 0: 원본
        { minVisibleCount: 500, decimationFactor: 2 },    // LOD 1: 2x 축소
        { minVisibleCount: 2000, decimationFactor: 4 },   // LOD 2: 4x 축소
        { minVisibleCount: 5000, decimationFactor: 8 },   // LOD 3: 8x 축소
        { minVisibleCount: 10000, decimationFactor: 16 }, // LOD 4: 16x 축소
        { minVisibleCount: 50000, decimationFactor: 32 }, // LOD 5: 32x 축소
      ],
      autoSwitch: options.autoSwitch ?? true,
      hysteresis: options.hysteresis ?? 10,
    };

    // LOD 레벨 초기화
    this.initializeLevels();
  }

  /**
   * LOD 레벨 초기화
   */
  private initializeLevels(): void {
    this.levels = this.options.levels.map((config, index) => ({
      id: index,
      minVisibleCount: config.minVisibleCount,
      decimationFactor: config.decimationFactor,
      cachedData: null,
      isDirty: true,
    }));
  }

  /**
   * 소스 데이터 설정
   */
  setSourceData(data: OHLCV[]): void {
    this.sourceData = data;

    // 모든 캐시 무효화
    this.levels.forEach((level) => {
      level.isDirty = true;
      level.cachedData = null;
    });

    // LOD 0 (원본)은 바로 생성
    if (this.levels.length > 0) {
      this.levels[0].cachedData = this.ohlcvToFloat32Array(data);
      this.levels[0].isDirty = false;
    }
  }

  /**
   * 현재 뷰에 적합한 LOD 레벨 선택
   */
  selectLevel(visibleDataCount: number): number {
    if (!this.options.autoSwitch) {
      return this.currentLevelId;
    }

    // 히스테리시스 적용 (너무 빈번한 전환 방지)
    const hysteresisAmount =
      (this.options.hysteresis / 100) * visibleDataCount;

    let selectedLevel = 0;

    for (let i = this.levels.length - 1; i >= 0; i--) {
      const level = this.levels[i];
      const threshold =
        i > this.currentLevelId
          ? level.minVisibleCount + hysteresisAmount
          : level.minVisibleCount - hysteresisAmount;

      if (visibleDataCount >= threshold) {
        selectedLevel = i;
        break;
      }
    }

    this.currentLevelId = selectedLevel;
    return selectedLevel;
  }

  /**
   * 특정 LOD 레벨의 데이터 가져오기
   */
  getLevelData(levelId: number): Float32Array | null {
    if (levelId < 0 || levelId >= this.levels.length) {
      return null;
    }

    const level = this.levels[levelId];

    // 캐시 히트
    if (!level.isDirty && level.cachedData) {
      return level.cachedData;
    }

    // 데시메이션 수행
    if (level.decimationFactor === 1) {
      level.cachedData = this.ohlcvToFloat32Array(this.sourceData);
    } else {
      level.cachedData = this.decimateM4(
        this.sourceData,
        level.decimationFactor
      );
    }

    level.isDirty = false;
    return level.cachedData;
  }

  /**
   * 현재 LOD 레벨의 데이터 가져오기
   */
  getCurrentLevelData(): Float32Array | null {
    return this.getLevelData(this.currentLevelId);
  }

  /**
   * 현재 LOD 레벨 정보
   */
  getCurrentLevel(): LODLevel {
    return this.levels[this.currentLevelId];
  }

  /**
   * 모든 LOD 레벨 정보
   */
  getAllLevels(): readonly LODLevel[] {
    return this.levels;
  }

  /**
   * M4 데시메이션 알고리즘
   * Min, Max, First, Last 값을 보존하여 시각적 정확성 유지
   */
  private decimateM4(data: OHLCV[], factor: number): Float32Array {
    if (data.length === 0) {
      return new Float32Array(0);
    }

    const targetCount = Math.ceil(data.length / factor);
    const result = new Float32Array(targetCount * FLOATS_PER_CANDLE);

    const bucketSize = data.length / targetCount;

    for (let bucket = 0; bucket < targetCount; bucket++) {
      const startIdx = Math.floor(bucket * bucketSize);
      const endIdx = Math.min(Math.floor((bucket + 1) * bucketSize), data.length);

      if (startIdx >= endIdx) continue;

      // 첫 번째 캔들
      const first = data[startIdx];
      let aggregated: DecimatedBucket = {
        time: first.time,
        open: first.open,
        high: first.high,
        low: first.low,
        close: first.close,
        volume: first.volume,
      };

      // 버킷 내 모든 캔들 집계
      for (let i = startIdx + 1; i < endIdx; i++) {
        const candle = data[i];
        if (candle.high > aggregated.high) aggregated.high = candle.high;
        if (candle.low < aggregated.low) aggregated.low = candle.low;
        aggregated.close = candle.close; // 마지막 종가
        aggregated.volume += candle.volume;
      }

      // Float32Array에 저장
      const offset = bucket * FLOATS_PER_CANDLE;
      result[offset] = aggregated.time;
      result[offset + 1] = aggregated.open;
      result[offset + 2] = aggregated.high;
      result[offset + 3] = aggregated.low;
      result[offset + 4] = aggregated.close;
      result[offset + 5] = aggregated.volume;
    }

    return result;
  }

  /**
   * OHLCV 배열을 Float32Array로 변환
   */
  private ohlcvToFloat32Array(data: OHLCV[]): Float32Array {
    const result = new Float32Array(data.length * FLOATS_PER_CANDLE);

    for (let i = 0; i < data.length; i++) {
      const candle = data[i];
      const offset = i * FLOATS_PER_CANDLE;
      result[offset] = candle.time;
      result[offset + 1] = candle.open;
      result[offset + 2] = candle.high;
      result[offset + 3] = candle.low;
      result[offset + 4] = candle.close;
      result[offset + 5] = candle.volume;
    }

    return result;
  }

  /**
   * 캐시 클리어
   */
  clearCache(): void {
    this.levels.forEach((level) => {
      level.cachedData = null;
      level.isDirty = true;
    });
  }

  /**
   * 메모리 사용량 계산 (bytes)
   */
  getMemoryUsage(): number {
    let total = 0;
    for (const level of this.levels) {
      if (level.cachedData) {
        total += level.cachedData.byteLength;
      }
    }
    return total;
  }

  /**
   * 정리
   */
  destroy(): void {
    this.clearCache();
    this.sourceData = [];
  }
}

/**
 * 적응형 LOD 선택 유틸리티
 * 화면 픽셀 밀도와 데이터 개수를 고려
 */
export function calculateOptimalLOD(
  dataCount: number,
  viewportWidth: number,
  minPixelsPerCandle: number = 2
): number {
  const maxVisibleCandles = viewportWidth / minPixelsPerCandle;
  const decimationFactor = Math.max(1, Math.ceil(dataCount / maxVisibleCandles));

  // 가장 가까운 2의 거듭제곱으로 반올림
  return Math.pow(2, Math.ceil(Math.log2(decimationFactor)));
}
