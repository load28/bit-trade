/**
 * BitChart - Compute Worker
 * 기술적 지표 계산 및 데이터 처리를 위한 워커
 *
 * Features:
 * - SMA, EMA, RSI, MACD, Bollinger Bands 계산
 * - M4 데시메이션 알고리즘 (대용량 데이터 축소)
 * - SharedArrayBuffer 기반 데이터 공유
 */

import type {
  ComputeWorkerMessage,
  ComputeWorkerResponse,
  InitMessage,
  ComputeIndicatorMessage,
  DecimateMessage,
} from '../types/worker';
import {
  SHARED_BUFFER_META,
  SHARED_BUFFER_DATA_OFFSET,
  FLOATS_PER_CANDLE,
} from '../types/worker';

// Worker 전역 상태
let sharedBuffer: SharedArrayBuffer | null = null;
let sharedMeta: Int32Array | null = null;
let sharedData: Float32Array | null = null;
let isInitialized = false;

/**
 * 메시지 핸들러
 */
self.onmessage = (event: MessageEvent<ComputeWorkerMessage>) => {
  const message = event.data;

  try {
    switch (message.type) {
      case 'init':
        handleInit(message);
        break;
      case 'computeIndicator':
        handleComputeIndicator(message);
        break;
      case 'decimate':
        handleDecimate(message);
        break;
      case 'destroy':
        handleDestroy();
        break;
    }
  } catch (error) {
    postError(error instanceof Error ? error.message : 'Unknown error', message.id);
  }
};

/**
 * 초기화
 */
function handleInit(message: InitMessage): void {
  if (message.sharedBuffer) {
    sharedBuffer = message.sharedBuffer;
    sharedMeta = new Int32Array(sharedBuffer, 0, SHARED_BUFFER_META.META_SIZE);
    const dataByteOffset = SHARED_BUFFER_META.META_SIZE * 4;
    const dataByteLength = sharedBuffer.byteLength - dataByteOffset;
    sharedData = new Float32Array(sharedBuffer, dataByteOffset, dataByteLength / 4);
  }

  isInitialized = true;

  const response: ComputeWorkerResponse = {
    type: 'ready',
    webglVersion: 0,
    maxTextureSize: 0,
    renderer: 'ComputeWorker',
  };
  self.postMessage(response);
}

/**
 * 지표 계산
 */
function handleComputeIndicator(message: ComputeIndicatorMessage): void {
  const { indicator, params, dataOffset, dataCount, id } = message;

  // 데이터 추출 (close 가격만 필요한 경우가 많음)
  const closeData = extractCloseData(dataOffset, dataCount);
  const ohlcData = extractOHLCData(dataOffset, dataCount);

  let result: Float32Array;

  switch (indicator) {
    case 'SMA':
      result = calculateSMA(closeData, params.period || 20);
      break;
    case 'EMA':
      result = calculateEMA(closeData, params.period || 20);
      break;
    case 'RSI':
      result = calculateRSI(closeData, params.period || 14);
      break;
    case 'MACD':
      result = calculateMACD(
        closeData,
        params.fastPeriod || 12,
        params.slowPeriod || 26,
        params.signalPeriod || 9
      );
      break;
    case 'BB':
      result = calculateBollingerBands(
        closeData,
        params.period || 20,
        params.stdDev || 2
      );
      break;
    default:
      throw new Error(`Unknown indicator: ${indicator}`);
  }

  const response: ComputeWorkerResponse = {
    type: 'indicatorResult',
    id,
    indicator,
    data: result,
  };

  // Transferable로 전송
  self.postMessage(response, [result.buffer]);
}

/**
 * M4 데시메이션
 */
function handleDecimate(message: DecimateMessage): void {
  const { dataOffset, dataCount, targetCount, id } = message;

  const ohlcData = extractOHLCData(dataOffset, dataCount);
  const result = decimateM4(ohlcData, targetCount);

  const response: ComputeWorkerResponse = {
    type: 'decimateResult',
    id,
    data: result,
    originalCount: dataCount,
    decimatedCount: result.length / FLOATS_PER_CANDLE,
  };

  self.postMessage(response, [result.buffer]);
}

/**
 * 종료 처리
 */
function handleDestroy(): void {
  sharedBuffer = null;
  sharedMeta = null;
  sharedData = null;
  isInitialized = false;
}

// ============================================
// 데이터 추출 함수
// ============================================

/**
 * Close 가격 데이터 추출
 */
function extractCloseData(offset: number, count: number): Float32Array {
  const closeData = new Float32Array(count);

  if (sharedData) {
    for (let i = 0; i < count; i++) {
      // close는 인덱스 4 (time=0, open=1, high=2, low=3, close=4, volume=5)
      closeData[i] = sharedData[offset + i * FLOATS_PER_CANDLE + 4];
    }
  }

  return closeData;
}

/**
 * OHLC 데이터 추출
 */
function extractOHLCData(offset: number, count: number): Float32Array {
  const ohlcData = new Float32Array(count * FLOATS_PER_CANDLE);

  if (sharedData) {
    for (let i = 0; i < count * FLOATS_PER_CANDLE; i++) {
      ohlcData[i] = sharedData[offset + i];
    }
  }

  return ohlcData;
}

// ============================================
// 기술적 지표 계산 함수
// ============================================

/**
 * Simple Moving Average (SMA)
 */
function calculateSMA(data: Float32Array, period: number): Float32Array {
  const result = new Float32Array(data.length);
  let sum = 0;

  for (let i = 0; i < data.length; i++) {
    sum += data[i];

    if (i >= period) {
      sum -= data[i - period];
      result[i] = sum / period;
    } else if (i === period - 1) {
      result[i] = sum / period;
    } else {
      result[i] = NaN;
    }
  }

  return result;
}

/**
 * Exponential Moving Average (EMA)
 */
function calculateEMA(data: Float32Array, period: number): Float32Array {
  const result = new Float32Array(data.length);
  const multiplier = 2 / (period + 1);

  // 첫 번째 EMA는 SMA
  let sum = 0;
  for (let i = 0; i < period && i < data.length; i++) {
    sum += data[i];
    result[i] = NaN;
  }

  if (period <= data.length) {
    result[period - 1] = sum / period;

    // 나머지 EMA 계산
    for (let i = period; i < data.length; i++) {
      result[i] = (data[i] - result[i - 1]) * multiplier + result[i - 1];
    }
  }

  return result;
}

/**
 * Relative Strength Index (RSI)
 */
function calculateRSI(data: Float32Array, period: number): Float32Array {
  const result = new Float32Array(data.length);
  const gains = new Float32Array(data.length);
  const losses = new Float32Array(data.length);

  // 가격 변화 계산
  for (let i = 1; i < data.length; i++) {
    const change = data[i] - data[i - 1];
    gains[i] = change > 0 ? change : 0;
    losses[i] = change < 0 ? -change : 0;
  }

  // 첫 번째 평균
  let avgGain = 0;
  let avgLoss = 0;

  for (let i = 1; i <= period && i < data.length; i++) {
    avgGain += gains[i];
    avgLoss += losses[i];
    result[i] = NaN;
  }

  avgGain /= period;
  avgLoss /= period;

  // RSI 계산
  for (let i = period; i < data.length; i++) {
    if (i > period) {
      avgGain = (avgGain * (period - 1) + gains[i]) / period;
      avgLoss = (avgLoss * (period - 1) + losses[i]) / period;
    }

    if (avgLoss === 0) {
      result[i] = 100;
    } else {
      const rs = avgGain / avgLoss;
      result[i] = 100 - 100 / (1 + rs);
    }
  }

  return result;
}

/**
 * MACD (Moving Average Convergence Divergence)
 * 결과: [macdLine, signalLine, histogram] * dataLength
 */
function calculateMACD(
  data: Float32Array,
  fastPeriod: number,
  slowPeriod: number,
  signalPeriod: number
): Float32Array {
  const fastEMA = calculateEMA(data, fastPeriod);
  const slowEMA = calculateEMA(data, slowPeriod);

  // MACD Line = Fast EMA - Slow EMA
  const macdLine = new Float32Array(data.length);
  for (let i = 0; i < data.length; i++) {
    macdLine[i] = fastEMA[i] - slowEMA[i];
  }

  // Signal Line = EMA of MACD Line
  const signalLine = calculateEMA(macdLine, signalPeriod);

  // Histogram = MACD Line - Signal Line
  const histogram = new Float32Array(data.length);
  for (let i = 0; i < data.length; i++) {
    histogram[i] = macdLine[i] - signalLine[i];
  }

  // 결과를 하나의 배열로 합침 (interleaved)
  const result = new Float32Array(data.length * 3);
  for (let i = 0; i < data.length; i++) {
    result[i * 3] = macdLine[i];
    result[i * 3 + 1] = signalLine[i];
    result[i * 3 + 2] = histogram[i];
  }

  return result;
}

/**
 * Bollinger Bands
 * 결과: [upper, middle, lower] * dataLength
 */
function calculateBollingerBands(
  data: Float32Array,
  period: number,
  stdDev: number
): Float32Array {
  const middle = calculateSMA(data, period);
  const result = new Float32Array(data.length * 3);

  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result[i * 3] = NaN;
      result[i * 3 + 1] = NaN;
      result[i * 3 + 2] = NaN;
      continue;
    }

    // 표준편차 계산
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) {
      const diff = data[j] - middle[i];
      sum += diff * diff;
    }
    const std = Math.sqrt(sum / period);

    result[i * 3] = middle[i] + stdDev * std; // Upper band
    result[i * 3 + 1] = middle[i];            // Middle band
    result[i * 3 + 2] = middle[i] - stdDev * std; // Lower band
  }

  return result;
}

// ============================================
// M4 데시메이션 알고리즘
// ============================================

/**
 * M4 데시메이션 알고리즘
 * 대량의 OHLCV 데이터를 목표 개수로 축소
 * 각 버킷에서 Min, Max, First, Last 값을 보존
 */
function decimateM4(data: Float32Array, targetCount: number): Float32Array {
  const sourceCount = data.length / FLOATS_PER_CANDLE;

  if (sourceCount <= targetCount) {
    // 이미 충분히 작음
    return new Float32Array(data);
  }

  const bucketSize = sourceCount / targetCount;
  const result = new Float32Array(targetCount * FLOATS_PER_CANDLE);

  for (let bucket = 0; bucket < targetCount; bucket++) {
    const startIdx = Math.floor(bucket * bucketSize);
    const endIdx = Math.min(Math.floor((bucket + 1) * bucketSize), sourceCount);

    if (startIdx >= endIdx) continue;

    // 버킷 내 첫 번째 캔들
    const firstOffset = startIdx * FLOATS_PER_CANDLE;
    let time = data[firstOffset]; // 첫 번째 시간
    let open = data[firstOffset + 1]; // 첫 번째 시가
    let high = data[firstOffset + 2];
    let low = data[firstOffset + 3];
    let close = data[firstOffset + 4];
    let volume = data[firstOffset + 5];

    // 버킷 내 모든 캔들 스캔
    for (let i = startIdx + 1; i < endIdx; i++) {
      const offset = i * FLOATS_PER_CANDLE;
      const h = data[offset + 2];
      const l = data[offset + 3];
      const c = data[offset + 4];
      const v = data[offset + 5];

      // M4: Min, Max 보존
      if (h > high) high = h;
      if (l < low) low = l;

      // 마지막 종가
      close = c;

      // 볼륨 합산
      volume += v;
    }

    // 결과 저장
    const resultOffset = bucket * FLOATS_PER_CANDLE;
    result[resultOffset] = time;
    result[resultOffset + 1] = open;
    result[resultOffset + 2] = high;
    result[resultOffset + 3] = low;
    result[resultOffset + 4] = close;
    result[resultOffset + 5] = volume;
  }

  return result;
}

// ============================================
// 유틸리티 함수
// ============================================

/**
 * 에러 응답 전송
 */
function postError(message: string, id?: string): void {
  const response: ComputeWorkerResponse = {
    type: 'error',
    message,
    id,
  };
  self.postMessage(response);
}
