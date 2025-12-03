/**
 * BitChart - Worker Message Types
 * Web Worker 간 통신을 위한 메시지 타입 정의
 */

import type { Viewport } from './data';

/** 메시지 베이스 타입 */
export interface WorkerMessageBase {
  type: string;
  id?: string; // 요청-응답 매칭용
}

// ============================================
// Main Thread → Render Worker 메시지
// ============================================

/** 초기화 메시지 */
export interface InitMessage extends WorkerMessageBase {
  type: 'init';
  canvas: OffscreenCanvas;
  width: number;
  height: number;
  devicePixelRatio: number;
  sharedBuffer?: SharedArrayBuffer;
}

/** 리사이즈 메시지 */
export interface ResizeMessage extends WorkerMessageBase {
  type: 'resize';
  width: number;
  height: number;
}

/** 데이터 업데이트 메시지 (Transferable) */
export interface UpdateDataMessage extends WorkerMessageBase {
  type: 'updateData';
  data: Float32Array;
}

/** SharedArrayBuffer 기반 데이터 업데이트 */
export interface UpdateDataSharedMessage extends WorkerMessageBase {
  type: 'updateDataShared';
  offset: number;
  count: number;
}

/** 뷰포트 업데이트 메시지 */
export interface SetViewportMessage extends WorkerMessageBase {
  type: 'setViewport';
  viewport: Viewport;
}

/** 테마 변경 메시지 */
export interface SetThemeMessage extends WorkerMessageBase {
  type: 'setTheme';
  theme: 'light' | 'dark';
  colors?: {
    up: [number, number, number, number];
    down: [number, number, number, number];
    background: [number, number, number, number];
  };
}

/** 시리즈 가시성 변경 */
export interface SetSeriesVisibilityMessage extends WorkerMessageBase {
  type: 'setSeriesVisibility';
  seriesId: string;
  visible: boolean;
}

/** 종료 메시지 */
export interface DestroyMessage extends WorkerMessageBase {
  type: 'destroy';
}

/** Render Worker로 보내는 모든 메시지 타입 */
export type RenderWorkerMessage =
  | InitMessage
  | ResizeMessage
  | UpdateDataMessage
  | UpdateDataSharedMessage
  | SetViewportMessage
  | SetThemeMessage
  | SetSeriesVisibilityMessage
  | DestroyMessage;

// ============================================
// Render Worker → Main Thread 메시지
// ============================================

/** 준비 완료 응답 */
export interface ReadyResponse extends WorkerMessageBase {
  type: 'ready';
  webglVersion: number;
  maxTextureSize: number;
  renderer: string;
}

/** 프레임 완료 응답 */
export interface FrameCompleteResponse extends WorkerMessageBase {
  type: 'frameComplete';
  timestamp: number;
  frameTime: number;
  drawCalls: number;
  instances: number;
}

/** 에러 응답 */
export interface ErrorResponse extends WorkerMessageBase {
  type: 'error';
  message: string;
  stack?: string;
}

/** Render Worker에서 오는 모든 메시지 타입 */
export type RenderWorkerResponse =
  | ReadyResponse
  | FrameCompleteResponse
  | ErrorResponse;

// ============================================
// Main Thread → Compute Worker 메시지
// ============================================

/** 지표 계산 요청 */
export interface ComputeIndicatorMessage extends WorkerMessageBase {
  type: 'computeIndicator';
  indicator: 'SMA' | 'EMA' | 'RSI' | 'MACD' | 'BB';
  params: Record<string, number>;
  dataOffset: number;
  dataCount: number;
}

/** M4 데시메이션 요청 */
export interface DecimateMessage extends WorkerMessageBase {
  type: 'decimate';
  dataOffset: number;
  dataCount: number;
  targetCount: number;
}

/** Compute Worker로 보내는 모든 메시지 타입 */
export type ComputeWorkerMessage =
  | InitMessage
  | ComputeIndicatorMessage
  | DecimateMessage
  | DestroyMessage;

// ============================================
// Compute Worker → Main Thread 메시지
// ============================================

/** 지표 계산 결과 */
export interface IndicatorResultResponse extends WorkerMessageBase {
  type: 'indicatorResult';
  indicator: string;
  data: Float32Array;
}

/** 데시메이션 결과 */
export interface DecimateResultResponse extends WorkerMessageBase {
  type: 'decimateResult';
  data: Float32Array;
  originalCount: number;
  decimatedCount: number;
}

/** Compute Worker에서 오는 모든 메시지 타입 */
export type ComputeWorkerResponse =
  | ReadyResponse
  | IndicatorResultResponse
  | DecimateResultResponse
  | ErrorResponse;

// ============================================
// SharedArrayBuffer 메모리 레이아웃
// ============================================

/** SharedArrayBuffer 메타데이터 오프셋 */
export const SHARED_BUFFER_META = {
  /** 데이터 개수 (int32) */
  DATA_COUNT: 0,
  /** Ring buffer head index (int32) */
  HEAD_INDEX: 1,
  /** 마지막 업데이트 타임스탬프 (int32, lower 32 bits) */
  LAST_UPDATE_LOW: 2,
  /** 마지막 업데이트 타임스탬프 (int32, upper 32 bits) */
  LAST_UPDATE_HIGH: 3,
  /** 메타데이터 총 크기 (int32 단위) */
  META_SIZE: 4,
} as const;

/** SharedArrayBuffer 데이터 오프셋 (floats) */
export const SHARED_BUFFER_DATA_OFFSET = SHARED_BUFFER_META.META_SIZE;

/** 캔들 하나당 float 개수 */
export const FLOATS_PER_CANDLE = 6; // time, open, high, low, close, volume
