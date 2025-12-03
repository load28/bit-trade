/**
 * BitChart - useChart Hook
 * ChartController를 React에서 편리하게 사용
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { OHLCV } from '../../types/data';
import type { ChartOptions } from '../../types/chart';
import { ChartController, type ChartEvent } from '../../core/ChartController';

/** useChart 옵션 */
export interface UseChartOptions extends Partial<ChartOptions> {
  /** 초기 데이터 */
  initialData?: OHLCV[];
  /** 자동 초기화 */
  autoInit?: boolean;
}

/** useChart 반환값 */
export interface UseChartReturn {
  /** 컨테이너 ref */
  containerRef: React.RefObject<HTMLDivElement>;
  /** ChartController 인스턴스 */
  controller: ChartController | null;
  /** 준비 상태 */
  isReady: boolean;
  /** 에러 */
  error: Error | null;
  /** 데이터 설정 */
  setData: (data: OHLCV[]) => void;
  /** 데이터 추가 */
  appendData: (candles: OHLCV[]) => void;
  /** 마지막 캔들 업데이트 */
  updateLastCandle: (candle: OHLCV) => void;
  /** 테마 설정 */
  setTheme: (theme: 'light' | 'dark') => void;
  /** 지표 계산 */
  computeIndicator: (
    indicator: 'SMA' | 'EMA' | 'RSI' | 'MACD' | 'BB',
    params: Record<string, number>
  ) => Promise<Float32Array>;
}

/**
 * useChart Hook
 * ChartController를 React에서 편리하게 사용
 */
export function useChart(options: UseChartOptions = {}): UseChartReturn {
  const containerRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<ChartController | null>(null);

  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const { initialData, autoInit = true, ...chartOptions } = options;

  // 차트 초기화
  useEffect(() => {
    if (!autoInit || !containerRef.current) return;

    const controller = new ChartController(chartOptions);
    controllerRef.current = controller;

    const handleEvent = (event: ChartEvent) => {
      if (event.type === 'ready') {
        setIsReady(true);
        if (initialData) {
          controller.setData(initialData);
        }
      } else if (event.type === 'error') {
        setError(event.error!);
      }
    };

    controller.addEventListener(handleEvent);

    controller.init(containerRef.current).catch((err) => {
      setError(err);
    });

    return () => {
      controller.removeEventListener(handleEvent);
      controller.destroy();
      controllerRef.current = null;
      setIsReady(false);
    };
  }, [autoInit]);

  // 메서드들
  const setData = useCallback((data: OHLCV[]) => {
    controllerRef.current?.setData(data);
  }, []);

  const appendData = useCallback((candles: OHLCV[]) => {
    controllerRef.current?.appendData(candles);
  }, []);

  const updateLastCandle = useCallback((candle: OHLCV) => {
    controllerRef.current?.updateLastCandle(candle);
  }, []);

  const setTheme = useCallback((theme: 'light' | 'dark') => {
    controllerRef.current?.setTheme(theme);
  }, []);

  const computeIndicator = useCallback(
    async (
      indicator: 'SMA' | 'EMA' | 'RSI' | 'MACD' | 'BB',
      params: Record<string, number>
    ): Promise<Float32Array> => {
      if (!controllerRef.current) {
        throw new Error('Chart not initialized');
      }
      return controllerRef.current.computeIndicator(indicator, params);
    },
    []
  );

  return {
    containerRef: containerRef as React.RefObject<HTMLDivElement>,
    controller: controllerRef.current,
    isReady,
    error,
    setData,
    appendData,
    updateLastCandle,
    setTheme,
    computeIndicator,
  };
}
