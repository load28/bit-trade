/**
 * BitChart - SharedArrayBuffer Data Manager
 * Main Thread와 Worker 간 Zero-Copy 데이터 공유 관리
 *
 * Features:
 * - SharedArrayBuffer 기반 데이터 저장
 * - Ring Buffer 구조로 실시간 데이터 추가 지원
 * - Atomic 연산으로 동기화
 * - 자동 버퍼 확장
 */

import type { OHLCV } from '../types/data';
import {
  SHARED_BUFFER_META,
  SHARED_BUFFER_DATA_OFFSET,
  FLOATS_PER_CANDLE,
} from '../types/worker';

/** SharedDataManager 옵션 */
export interface SharedDataManagerOptions {
  /** 초기 데이터 용량 (캔들 개수) */
  initialCapacity?: number;
  /** 최대 데이터 용량 (캔들 개수) */
  maxCapacity?: number;
  /** Ring Buffer 모드 (true면 오래된 데이터 덮어씀) */
  ringBufferMode?: boolean;
}

/** 데이터 변경 이벤트 */
export interface DataChangeEvent {
  type: 'append' | 'update' | 'replace' | 'clear';
  offset: number;
  count: number;
  timestamp: number;
}

/** 데이터 변경 리스너 */
export type DataChangeListener = (event: DataChangeEvent) => void;

/**
 * SharedArrayBuffer 데이터 매니저
 * Main Thread에서 데이터를 관리하고 Worker와 공유
 */
export class SharedDataManager {
  private buffer: SharedArrayBuffer | null = null;
  private metaView: Int32Array | null = null;
  private dataView: Float32Array | null = null;

  private capacity: number;
  private maxCapacity: number;
  private ringBufferMode: boolean;
  private listeners: Set<DataChangeListener> = new Set();

  // SharedArrayBuffer 지원 여부
  private static supportsSharedArrayBuffer: boolean | null = null;

  constructor(options: SharedDataManagerOptions = {}) {
    this.capacity = options.initialCapacity ?? 10000;
    this.maxCapacity = options.maxCapacity ?? 1000000;
    this.ringBufferMode = options.ringBufferMode ?? false;

    // SharedArrayBuffer 지원 확인
    if (SharedDataManager.supportsSharedArrayBuffer === null) {
      SharedDataManager.supportsSharedArrayBuffer = this.checkSharedArrayBufferSupport();
    }

    if (SharedDataManager.supportsSharedArrayBuffer) {
      this.allocateBuffer(this.capacity);
    }
  }

  /**
   * SharedArrayBuffer 지원 확인
   */
  private checkSharedArrayBufferSupport(): boolean {
    try {
      // COOP/COEP 헤더 필요
      if (typeof SharedArrayBuffer === 'undefined') {
        return false;
      }
      // 테스트 버퍼 생성
      const testBuffer = new SharedArrayBuffer(1);
      return testBuffer.byteLength === 1;
    } catch {
      return false;
    }
  }

  /**
   * SharedArrayBuffer 할당
   */
  private allocateBuffer(capacity: number): void {
    // 메타데이터 + 데이터 영역 크기 계산
    const metaBytes = SHARED_BUFFER_META.META_SIZE * 4; // int32 = 4 bytes
    const dataBytes = capacity * FLOATS_PER_CANDLE * 4; // float32 = 4 bytes
    const totalBytes = metaBytes + dataBytes;

    this.buffer = new SharedArrayBuffer(totalBytes);
    this.metaView = new Int32Array(this.buffer, 0, SHARED_BUFFER_META.META_SIZE);
    this.dataView = new Float32Array(
      this.buffer,
      metaBytes,
      capacity * FLOATS_PER_CANDLE
    );

    // 메타데이터 초기화
    Atomics.store(this.metaView, SHARED_BUFFER_META.DATA_COUNT, 0);
    Atomics.store(this.metaView, SHARED_BUFFER_META.HEAD_INDEX, 0);

    this.capacity = capacity;
  }

  /**
   * 버퍼 확장
   */
  private expandBuffer(newCapacity: number): void {
    if (!SharedDataManager.supportsSharedArrayBuffer) return;

    const oldDataView = this.dataView;
    const oldCount = this.getDataCount();

    // 새 버퍼 할당
    this.allocateBuffer(newCapacity);

    // 기존 데이터 복사
    if (oldDataView && this.dataView) {
      const copyLength = Math.min(oldCount * FLOATS_PER_CANDLE, this.dataView.length);
      this.dataView.set(oldDataView.subarray(0, copyLength));
      Atomics.store(this.metaView!, SHARED_BUFFER_META.DATA_COUNT, oldCount);
    }
  }

  /**
   * SharedArrayBuffer 가져오기
   */
  getSharedBuffer(): SharedArrayBuffer | null {
    return this.buffer;
  }

  /**
   * SharedArrayBuffer 지원 여부
   */
  isSharedBufferSupported(): boolean {
    return SharedDataManager.supportsSharedArrayBuffer ?? false;
  }

  /**
   * 현재 데이터 개수
   */
  getDataCount(): number {
    if (!this.metaView) return 0;
    return Atomics.load(this.metaView, SHARED_BUFFER_META.DATA_COUNT);
  }

  /**
   * 현재 용량
   */
  getCapacity(): number {
    return this.capacity;
  }

  /**
   * 데이터 설정 (전체 교체)
   */
  setData(data: OHLCV[]): void {
    const count = data.length;

    // 용량 부족시 확장
    if (count > this.capacity) {
      const newCapacity = Math.min(
        Math.max(count, this.capacity * 2),
        this.maxCapacity
      );
      this.expandBuffer(newCapacity);
    }

    if (!this.dataView || !this.metaView) {
      // SharedArrayBuffer 미지원시 일반 ArrayBuffer 사용
      this.setDataFallback(data);
      return;
    }

    // 데이터 복사
    for (let i = 0; i < count; i++) {
      const candle = data[i];
      const offset = i * FLOATS_PER_CANDLE;
      this.dataView[offset] = candle.time;
      this.dataView[offset + 1] = candle.open;
      this.dataView[offset + 2] = candle.high;
      this.dataView[offset + 3] = candle.low;
      this.dataView[offset + 4] = candle.close;
      this.dataView[offset + 5] = candle.volume;
    }

    // 메타데이터 업데이트
    Atomics.store(this.metaView, SHARED_BUFFER_META.DATA_COUNT, count);
    Atomics.store(this.metaView, SHARED_BUFFER_META.HEAD_INDEX, 0);
    this.updateTimestamp();

    // 이벤트 발생
    this.notifyListeners({
      type: 'replace',
      offset: 0,
      count,
      timestamp: Date.now(),
    });
  }

  /**
   * 데이터 추가 (끝에)
   */
  appendData(candles: OHLCV[]): void {
    if (candles.length === 0) return;

    const currentCount = this.getDataCount();
    const newCount = currentCount + candles.length;

    // 용량 부족시 처리
    if (newCount > this.capacity) {
      if (this.ringBufferMode) {
        // Ring Buffer 모드: 오래된 데이터 덮어씀
        this.appendDataRingBuffer(candles);
        return;
      } else {
        // 버퍼 확장
        const newCapacity = Math.min(
          Math.max(newCount, this.capacity * 2),
          this.maxCapacity
        );
        if (newCapacity <= this.capacity) {
          console.warn('SharedDataManager: Max capacity reached');
          return;
        }
        this.expandBuffer(newCapacity);
      }
    }

    if (!this.dataView || !this.metaView) return;

    // 데이터 추가
    for (let i = 0; i < candles.length; i++) {
      const candle = candles[i];
      const offset = (currentCount + i) * FLOATS_PER_CANDLE;
      this.dataView[offset] = candle.time;
      this.dataView[offset + 1] = candle.open;
      this.dataView[offset + 2] = candle.high;
      this.dataView[offset + 3] = candle.low;
      this.dataView[offset + 4] = candle.close;
      this.dataView[offset + 5] = candle.volume;
    }

    // 메타데이터 업데이트
    Atomics.store(this.metaView, SHARED_BUFFER_META.DATA_COUNT, newCount);
    this.updateTimestamp();

    // 이벤트 발생
    this.notifyListeners({
      type: 'append',
      offset: currentCount * FLOATS_PER_CANDLE,
      count: candles.length,
      timestamp: Date.now(),
    });
  }

  /**
   * Ring Buffer 모드 데이터 추가
   */
  private appendDataRingBuffer(candles: OHLCV[]): void {
    if (!this.dataView || !this.metaView) return;

    const headIndex = Atomics.load(this.metaView, SHARED_BUFFER_META.HEAD_INDEX);

    for (let i = 0; i < candles.length; i++) {
      const candle = candles[i];
      const index = (headIndex + i) % this.capacity;
      const offset = index * FLOATS_PER_CANDLE;

      this.dataView[offset] = candle.time;
      this.dataView[offset + 1] = candle.open;
      this.dataView[offset + 2] = candle.high;
      this.dataView[offset + 3] = candle.low;
      this.dataView[offset + 4] = candle.close;
      this.dataView[offset + 5] = candle.volume;
    }

    // Head 인덱스 업데이트
    const newHeadIndex = (headIndex + candles.length) % this.capacity;
    Atomics.store(this.metaView, SHARED_BUFFER_META.HEAD_INDEX, newHeadIndex);

    // 데이터 개수 (최대 용량까지)
    const currentCount = this.getDataCount();
    const newCount = Math.min(currentCount + candles.length, this.capacity);
    Atomics.store(this.metaView, SHARED_BUFFER_META.DATA_COUNT, newCount);

    this.updateTimestamp();
  }

  /**
   * 마지막 캔들 업데이트 (실시간 가격 업데이트용)
   */
  updateLastCandle(candle: OHLCV): void {
    const count = this.getDataCount();
    if (count === 0 || !this.dataView || !this.metaView) return;

    const offset = (count - 1) * FLOATS_PER_CANDLE;
    this.dataView[offset] = candle.time;
    this.dataView[offset + 1] = candle.open;
    this.dataView[offset + 2] = candle.high;
    this.dataView[offset + 3] = candle.low;
    this.dataView[offset + 4] = candle.close;
    this.dataView[offset + 5] = candle.volume;

    this.updateTimestamp();

    // 이벤트 발생
    this.notifyListeners({
      type: 'update',
      offset: offset,
      count: 1,
      timestamp: Date.now(),
    });
  }

  /**
   * 타임스탬프 업데이트 (Atomic)
   */
  private updateTimestamp(): void {
    if (!this.metaView) return;

    const now = Date.now();
    const low = now & 0xffffffff;
    const high = Math.floor(now / 0x100000000);

    Atomics.store(this.metaView, SHARED_BUFFER_META.LAST_UPDATE_LOW, low);
    Atomics.store(this.metaView, SHARED_BUFFER_META.LAST_UPDATE_HIGH, high);
  }

  /**
   * 마지막 업데이트 타임스탬프
   */
  getLastUpdateTimestamp(): number {
    if (!this.metaView) return 0;

    const low = Atomics.load(this.metaView, SHARED_BUFFER_META.LAST_UPDATE_LOW);
    const high = Atomics.load(this.metaView, SHARED_BUFFER_META.LAST_UPDATE_HIGH);

    return high * 0x100000000 + low;
  }

  /**
   * 데이터 가져오기 (복사본)
   */
  getData(): OHLCV[] {
    const count = this.getDataCount();
    const result: OHLCV[] = [];

    if (!this.dataView) return result;

    for (let i = 0; i < count; i++) {
      const offset = i * FLOATS_PER_CANDLE;
      result.push({
        time: this.dataView[offset],
        open: this.dataView[offset + 1],
        high: this.dataView[offset + 2],
        low: this.dataView[offset + 3],
        close: this.dataView[offset + 4],
        volume: this.dataView[offset + 5],
      });
    }

    return result;
  }

  /**
   * Float32Array 데이터 직접 가져오기
   */
  getDataBuffer(): Float32Array | null {
    if (!this.dataView) return null;
    const count = this.getDataCount();
    return this.dataView.subarray(0, count * FLOATS_PER_CANDLE);
  }

  /**
   * 데이터 클리어
   */
  clear(): void {
    if (this.metaView) {
      Atomics.store(this.metaView, SHARED_BUFFER_META.DATA_COUNT, 0);
      Atomics.store(this.metaView, SHARED_BUFFER_META.HEAD_INDEX, 0);
      this.updateTimestamp();
    }

    this.notifyListeners({
      type: 'clear',
      offset: 0,
      count: 0,
      timestamp: Date.now(),
    });
  }

  /**
   * 이벤트 리스너 등록
   */
  addListener(listener: DataChangeListener): void {
    this.listeners.add(listener);
  }

  /**
   * 이벤트 리스너 제거
   */
  removeListener(listener: DataChangeListener): void {
    this.listeners.delete(listener);
  }

  /**
   * 리스너 알림
   */
  private notifyListeners(event: DataChangeEvent): void {
    this.listeners.forEach((listener) => {
      try {
        listener(event);
      } catch (e) {
        console.error('SharedDataManager listener error:', e);
      }
    });
  }

  /**
   * SharedArrayBuffer 미지원시 Fallback
   */
  private setDataFallback(data: OHLCV[]): void {
    // 일반 ArrayBuffer 사용
    const buffer = new ArrayBuffer(data.length * FLOATS_PER_CANDLE * 4);
    this.dataView = new Float32Array(buffer);

    for (let i = 0; i < data.length; i++) {
      const candle = data[i];
      const offset = i * FLOATS_PER_CANDLE;
      this.dataView[offset] = candle.time;
      this.dataView[offset + 1] = candle.open;
      this.dataView[offset + 2] = candle.high;
      this.dataView[offset + 3] = candle.low;
      this.dataView[offset + 4] = candle.close;
      this.dataView[offset + 5] = candle.volume;
    }

    this.capacity = data.length;

    this.notifyListeners({
      type: 'replace',
      offset: 0,
      count: data.length,
      timestamp: Date.now(),
    });
  }

  /**
   * Transferable ArrayBuffer 생성 (Worker에 전송용)
   */
  createTransferableBuffer(): { buffer: ArrayBuffer; data: Float32Array } {
    const count = this.getDataCount();
    const buffer = new ArrayBuffer(count * FLOATS_PER_CANDLE * 4);
    const data = new Float32Array(buffer);

    if (this.dataView) {
      data.set(this.dataView.subarray(0, count * FLOATS_PER_CANDLE));
    }

    return { buffer, data };
  }

  /**
   * 정리
   */
  destroy(): void {
    this.listeners.clear();
    this.buffer = null;
    this.metaView = null;
    this.dataView = null;
  }
}
