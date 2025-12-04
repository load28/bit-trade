/**
 * BitChart - useIndicator Hook
 * 기술적 지표 계산
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import type { ChartController } from '../../core/ChartController';

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
  compute: (sourceData?: unknown[]) => Promise<void>;
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
