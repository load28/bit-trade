/**
 * BitChart - React Hooks
 */

'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { OHLCV } from '../types/data';
import type { ChartOptions } from '../types/chart';
import { ChartController, type ChartEvent } from '../core/ChartController';
import {
  RealtimeDataHandler,
  type RealtimeEvent,
  type RealtimeHandlerOptions,
} from '../realtime/RealtimeDataHandler';

// ============================================
// useChart Hook
// ============================================

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

// ============================================
// useChartData Hook
// ============================================

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

// ============================================
// useRealtimeData Hook
// ============================================

/** useRealtimeData 옵션 */
export interface UseRealtimeDataOptions extends RealtimeHandlerOptions {
  /** 자동 연결 */
  autoConnect?: boolean;
  /** 연결 완료 콜백 */
  onConnect?: () => void;
  /** 연결 해제 콜백 */
  onDisconnect?: () => void;
  /** 에러 콜백 */
  onError?: (error: Error) => void;
}

/** useRealtimeData 반환값 */
export interface UseRealtimeDataReturn {
  /** 연결 상태 */
  isConnected: boolean;
  /** 연결 중 */
  isConnecting: boolean;
  /** 에러 */
  error: Error | null;
  /** 현재 진행 중인 캔들 */
  currentCandle: OHLCV | null;
  /** 최근 틱 */
  lastTick: { time: number; price: number; volume?: number } | null;
  /** 연결 */
  connect: (url?: string) => void;
  /** 연결 해제 */
  disconnect: () => void;
  /** 구독 */
  subscribe: (symbol: string, channel?: string) => void;
  /** 구독 해제 */
  unsubscribe: (symbol: string, channel?: string) => void;
  /** 이벤트 리스너 추가 */
  addEventListener: (listener: (event: RealtimeEvent) => void) => void;
  /** 이벤트 리스너 제거 */
  removeEventListener: (listener: (event: RealtimeEvent) => void) => void;
}

/**
 * useRealtimeData Hook
 * 실시간 데이터 연결 관리
 */
export function useRealtimeData(
  options: UseRealtimeDataOptions = {}
): UseRealtimeDataReturn {
  const { autoConnect = false, onConnect, onDisconnect, onError, ...handlerOptions } = options;

  const handlerRef = useRef<RealtimeDataHandler | null>(null);

  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [currentCandle, setCurrentCandle] = useState<OHLCV | null>(null);
  const [lastTick, setLastTick] = useState<{
    time: number;
    price: number;
    volume?: number;
  } | null>(null);

  // 핸들러 초기화
  useEffect(() => {
    const handler = new RealtimeDataHandler(handlerOptions);
    handlerRef.current = handler;

    const handleEvent = (event: RealtimeEvent) => {
      switch (event.type) {
        case 'connect':
          setIsConnected(true);
          setIsConnecting(false);
          setError(null);
          onConnect?.();
          break;
        case 'disconnect':
          setIsConnected(false);
          setIsConnecting(false);
          onDisconnect?.();
          break;
        case 'error':
          setError(event.error!);
          setIsConnecting(false);
          onError?.(event.error!);
          break;
        case 'tick':
          setLastTick(
            event.data as { time: number; price: number; volume?: number }
          );
          break;
        case 'candle':
          setCurrentCandle(event.data as OHLCV);
          break;
      }
    };

    handler.addEventListener(handleEvent);

    if (autoConnect && handlerOptions.url) {
      setIsConnecting(true);
      handler.connect();
    }

    return () => {
      handler.removeEventListener(handleEvent);
      handler.destroy();
      handlerRef.current = null;
    };
  }, []);

  // 메서드들
  const connect = useCallback((url?: string) => {
    if (!handlerRef.current) return;
    setIsConnecting(true);
    handlerRef.current.connect(url);
  }, []);

  const disconnect = useCallback(() => {
    handlerRef.current?.disconnect();
    setIsConnected(false);
    setIsConnecting(false);
  }, []);

  const subscribe = useCallback((symbol: string, channel?: string) => {
    handlerRef.current?.subscribe(symbol, channel);
  }, []);

  const unsubscribe = useCallback((symbol: string, channel?: string) => {
    handlerRef.current?.unsubscribe(symbol, channel);
  }, []);

  const addEventListener = useCallback(
    (listener: (event: RealtimeEvent) => void) => {
      handlerRef.current?.addEventListener(listener);
    },
    []
  );

  const removeEventListener = useCallback(
    (listener: (event: RealtimeEvent) => void) => {
      handlerRef.current?.removeEventListener(listener);
    },
    []
  );

  return {
    isConnected,
    isConnecting,
    error,
    currentCandle,
    lastTick,
    connect,
    disconnect,
    subscribe,
    unsubscribe,
    addEventListener,
    removeEventListener,
  };
}

// ============================================
// useIndicator Hook
// ============================================

/** 지표 타입 */
export type IndicatorType = 'SMA' | 'EMA' | 'RSI' | 'MACD' | 'BB';

/** useIndicator 옵션 */
export interface UseIndicatorOptions {
  /** 지표 타입 */
  type: IndicatorType;
  /** 지표 파라미터 */
  params: Record<string, number>;
  /** 자동 계산 */
  autoCompute?: boolean;
}

/** useIndicator 반환값 */
export interface UseIndicatorReturn {
  /** 지표 데이터 */
  data: Float32Array | null;
  /** 로딩 상태 */
  isLoading: boolean;
  /** 에러 */
  error: Error | null;
  /** 계산 실행 */
  compute: (sourceData?: OHLCV[]) => Promise<void>;
}

/**
 * useIndicator Hook
 * 기술적 지표 계산
 */
export function useIndicator(
  chartController: ChartController | null,
  options: UseIndicatorOptions
): UseIndicatorReturn {
  const { type, params, autoCompute = false } = options;

  const [data, setData] = useState<Float32Array | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const compute = useCallback(async () => {
    if (!chartController) {
      setError(new Error('Chart controller not available'));
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await chartController.computeIndicator(type, params);
      setData(result);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [chartController, type, params]);

  // 자동 계산
  useEffect(() => {
    if (autoCompute && chartController) {
      compute();
    }
  }, [autoCompute, chartController, compute]);

  return {
    data,
    isLoading,
    error,
    compute,
  };
}
