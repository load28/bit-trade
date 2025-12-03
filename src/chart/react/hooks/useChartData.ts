/**
 * BitChart - useChartData Hook
 * 차트 데이터 상태 관리
 */

'use client';

import { useState, useCallback, useMemo } from 'react';
import type { OHLCV } from '../../types/data';

/** useChartData 옵션 */
export interface UseChartDataOptions {
  /** 초기 데이터 */
  initialData?: OHLCV[];
  /** 최대 데이터 개수 */
  maxLength?: number;
  /** 데이터 정렬 (시간순) */
  sorted?: boolean;
}

/** useChartData 반환값 */
export interface UseChartDataReturn {
  /** 현재 데이터 */
  data: OHLCV[];
  /** 데이터 설정 */
  setData: (data: OHLCV[]) => void;
  /** 데이터 추가 */
  appendData: (candles: OHLCV[]) => void;
  /** 마지막 캔들 업데이트 */
  updateLastCandle: (candle: OHLCV) => void;
  /** 데이터 클리어 */
  clearData: () => void;
  /** 데이터 개수 */
  length: number;
  /** 데이터 범위 */
  range: { minTime: number; maxTime: number; minPrice: number; maxPrice: number } | null;
}

/**
 * useChartData Hook
 * 차트 데이터 상태 관리
 */
export function useChartData(options: UseChartDataOptions = {}): UseChartDataReturn {
  const { initialData = [], maxLength = 100000, sorted = true } = options;

  const [data, setDataState] = useState<OHLCV[]>(initialData);

  // 데이터 설정
  const setData = useCallback(
    (newData: OHLCV[]) => {
      let processedData = newData;

      if (sorted) {
        processedData = [...newData].sort((a, b) => a.time - b.time);
      }

      if (processedData.length > maxLength) {
        processedData = processedData.slice(-maxLength);
      }

      setDataState(processedData);
    },
    [maxLength, sorted]
  );

  // 데이터 추가
  const appendData = useCallback(
    (candles: OHLCV[]) => {
      setDataState((prev) => {
        let newData = [...prev, ...candles];

        if (sorted) {
          newData = newData.sort((a, b) => a.time - b.time);
        }

        if (newData.length > maxLength) {
          newData = newData.slice(-maxLength);
        }

        return newData;
      });
    },
    [maxLength, sorted]
  );

  // 마지막 캔들 업데이트
  const updateLastCandle = useCallback((candle: OHLCV) => {
    setDataState((prev) => {
      if (prev.length === 0) return [candle];

      const last = prev[prev.length - 1];

      if (last.time === candle.time) {
        // 같은 캔들 업데이트
        return [...prev.slice(0, -1), candle];
      } else if (candle.time > last.time) {
        // 새 캔들 추가
        return [...prev, candle];
      }

      return prev;
    });
  }, []);

  // 데이터 클리어
  const clearData = useCallback(() => {
    setDataState([]);
  }, []);

  // 데이터 범위 계산
  const range = useMemo(() => {
    if (data.length === 0) return null;

    let minTime = Infinity;
    let maxTime = -Infinity;
    let minPrice = Infinity;
    let maxPrice = -Infinity;

    for (const candle of data) {
      if (candle.time < minTime) minTime = candle.time;
      if (candle.time > maxTime) maxTime = candle.time;
      if (candle.low < minPrice) minPrice = candle.low;
      if (candle.high > maxPrice) maxPrice = candle.high;
    }

    return { minTime, maxTime, minPrice, maxPrice };
  }, [data]);

  return {
    data,
    setData,
    appendData,
    updateLastCandle,
    clearData,
    length: data.length,
    range,
  };
}
