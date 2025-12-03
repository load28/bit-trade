/**
 * BitChart - Math Utilities
 * 수학 관련 유틸리티 함수들
 */

/**
 * 값을 특정 범위로 클램프
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * 선형 보간
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * 역선형 보간 (값이 범위 내에서 어디에 위치하는지)
 */
export function inverseLerp(a: number, b: number, value: number): number {
  if (a === b) return 0;
  return (value - a) / (b - a);
}

/**
 * 범위 매핑
 */
export function mapRange(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
): number {
  return outMin + ((value - inMin) * (outMax - outMin)) / (inMax - inMin);
}

/**
 * 로그 스케일 변환
 */
export function logScale(value: number, min: number, max: number): number {
  if (value <= 0 || min <= 0) return 0;
  const logMin = Math.log10(min);
  const logMax = Math.log10(max);
  const logValue = Math.log10(value);
  return (logValue - logMin) / (logMax - logMin);
}

/**
 * 역 로그 스케일 변환
 */
export function inverseLogScale(t: number, min: number, max: number): number {
  const logMin = Math.log10(min);
  const logMax = Math.log10(max);
  return Math.pow(10, logMin + t * (logMax - logMin));
}

/**
 * 숫자를 지정된 정밀도로 반올림
 */
export function roundToPrecision(value: number, precision: number): number {
  const multiplier = Math.pow(10, precision);
  return Math.round(value * multiplier) / multiplier;
}

/**
 * "좋은" 눈금 간격 계산 (1, 2, 5 배수)
 */
export function calculateNiceStep(range: number, targetSteps: number = 5): number {
  const roughStep = range / targetSteps;
  const magnitude = Math.pow(10, Math.floor(Math.log10(roughStep)));
  const residual = roughStep / magnitude;

  let niceStep: number;
  if (residual <= 1.5) {
    niceStep = 1;
  } else if (residual <= 3) {
    niceStep = 2;
  } else if (residual <= 7) {
    niceStep = 5;
  } else {
    niceStep = 10;
  }

  return niceStep * magnitude;
}

/**
 * 범위에서 "좋은" 눈금 값들 계산
 */
export function calculateNiceTicks(min: number, max: number, targetTicks: number = 5): number[] {
  const step = calculateNiceStep(max - min, targetTicks);
  const start = Math.ceil(min / step) * step;
  const ticks: number[] = [];

  for (let tick = start; tick <= max; tick += step) {
    ticks.push(roundToPrecision(tick, 10));
  }

  return ticks;
}

/**
 * 시간 기반 "좋은" 눈금 간격 계산 (밀리초)
 */
export function calculateNiceTimeStep(rangeMs: number, targetSteps: number = 5): number {
  const MINUTE = 60 * 1000;
  const HOUR = 60 * MINUTE;
  const DAY = 24 * HOUR;
  const WEEK = 7 * DAY;
  const MONTH = 30 * DAY;
  const YEAR = 365 * DAY;

  const intervals = [
    1000, // 1 second
    5 * 1000,
    10 * 1000,
    30 * 1000,
    MINUTE,
    5 * MINUTE,
    15 * MINUTE,
    30 * MINUTE,
    HOUR,
    2 * HOUR,
    4 * HOUR,
    6 * HOUR,
    12 * HOUR,
    DAY,
    2 * DAY,
    WEEK,
    2 * WEEK,
    MONTH,
    3 * MONTH,
    6 * MONTH,
    YEAR,
  ];

  const roughStep = rangeMs / targetSteps;

  for (const interval of intervals) {
    if (interval >= roughStep) {
      return interval;
    }
  }

  return YEAR;
}

/**
 * 2의 거듭제곱으로 올림
 */
export function nextPowerOfTwo(value: number): number {
  return Math.pow(2, Math.ceil(Math.log2(value)));
}

/**
 * 2의 거듭제곱인지 확인
 */
export function isPowerOfTwo(value: number): boolean {
  return (value & (value - 1)) === 0 && value !== 0;
}

/**
 * 거리 계산 (2D)
 */
export function distance(x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * 각도를 라디안으로 변환
 */
export function degreesToRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * 라디안을 각도로 변환
 */
export function radiansToDegrees(radians: number): number {
  return radians * (180 / Math.PI);
}

/**
 * 배열의 최소값
 */
export function arrayMin(arr: number[]): number {
  if (arr.length === 0) return 0;
  let min = arr[0];
  for (let i = 1; i < arr.length; i++) {
    if (arr[i] < min) min = arr[i];
  }
  return min;
}

/**
 * 배열의 최대값
 */
export function arrayMax(arr: number[]): number {
  if (arr.length === 0) return 0;
  let max = arr[0];
  for (let i = 1; i < arr.length; i++) {
    if (arr[i] > max) max = arr[i];
  }
  return max;
}

/**
 * 배열의 최소/최대값 동시에 구하기
 */
export function arrayMinMax(arr: number[]): [number, number] {
  if (arr.length === 0) return [0, 0];
  let min = arr[0];
  let max = arr[0];
  for (let i = 1; i < arr.length; i++) {
    if (arr[i] < min) min = arr[i];
    if (arr[i] > max) max = arr[i];
  }
  return [min, max];
}

/**
 * 이진 검색 - 값보다 크거나 같은 첫 번째 인덱스 찾기
 */
export function lowerBound(arr: number[], value: number): number {
  let left = 0;
  let right = arr.length;

  while (left < right) {
    const mid = Math.floor((left + right) / 2);
    if (arr[mid] < value) {
      left = mid + 1;
    } else {
      right = mid;
    }
  }

  return left;
}

/**
 * 이진 검색 - 값보다 큰 첫 번째 인덱스 찾기
 */
export function upperBound(arr: number[], value: number): number {
  let left = 0;
  let right = arr.length;

  while (left < right) {
    const mid = Math.floor((left + right) / 2);
    if (arr[mid] <= value) {
      left = mid + 1;
    } else {
      right = mid;
    }
  }

  return left;
}

/**
 * 스무딩 팩터 계산 (지수 이동 평균용)
 */
export function smoothingFactor(period: number): number {
  return 2 / (period + 1);
}
