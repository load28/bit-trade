/**
 * BitChart - React Chart Component
 * React wrapper for ChartController
 */

'use client';

import React, {
  useRef,
  useEffect,
  useImperativeHandle,
  forwardRef,
  useCallback,
  useState,
} from 'react';
import { ChartController, type ChartEvent } from '../core/ChartController';
import type { OHLCV } from '../types/data';
import type { ChartOptions } from '../types/chart';

/** 차트 컴포넌트 Props */
export interface ChartProps {
  /** 차트 데이터 */
  data?: OHLCV[];
  /** 차트 옵션 */
  options?: Partial<ChartOptions>;
  /** 너비 (CSS 단위) */
  width?: string | number;
  /** 높이 (CSS 단위) */
  height?: string | number;
  /** 클래스명 */
  className?: string;
  /** 스타일 */
  style?: React.CSSProperties;
  /** 준비 완료 콜백 */
  onReady?: () => void;
  /** 크로스헤어 이벤트 */
  onCrosshair?: (data: {
    x: number;
    y: number;
    time: number;
    price: number;
  }) => void;
  /** 뷰포트 변경 이벤트 */
  onViewportChange?: (viewport: unknown) => void;
  /** 클릭 이벤트 */
  onClick?: (data: { time: number; price: number }) => void;
  /** 에러 이벤트 */
  onError?: (error: Error) => void;
}

/** 차트 Ref 핸들 */
export interface ChartRef {
  /** ChartController 인스턴스 */
  controller: ChartController | null;
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
  /** 뷰 리셋 */
  resetView: () => void;
}

/**
 * Chart Component
 */
export const Chart = forwardRef<ChartRef, ChartProps>(function Chart(
  {
    data,
    options,
    width = '100%',
    height = 400,
    className,
    style,
    onReady,
    onCrosshair,
    onViewportChange,
    onClick,
    onError,
  },
  ref
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<ChartController | null>(null);
  const [isReady, setIsReady] = useState(false);

  // 이벤트 핸들러
  const handleChartEvent = useCallback(
    (event: ChartEvent) => {
      switch (event.type) {
        case 'ready':
          setIsReady(true);
          onReady?.();
          break;
        case 'crosshair':
          onCrosshair?.(
            event.data as { x: number; y: number; time: number; price: number }
          );
          break;
        case 'viewportChange':
          onViewportChange?.(event.data);
          break;
        case 'click':
          onClick?.(event.data as { time: number; price: number });
          break;
        case 'error':
          onError?.(event.error!);
          break;
      }
    },
    [onReady, onCrosshair, onViewportChange, onClick, onError]
  );

  // 차트 초기화
  useEffect(() => {
    if (!containerRef.current) return;

    const controller = new ChartController(options);
    controllerRef.current = controller;

    controller.addEventListener(handleChartEvent);

    controller.init(containerRef.current).catch((error) => {
      console.error('Chart initialization failed:', error);
      onError?.(error);
    });

    return () => {
      controller.removeEventListener(handleChartEvent);
      controller.destroy();
      controllerRef.current = null;
      setIsReady(false);
    };
  }, []); // options 변경 시 재초기화하지 않음

  // 데이터 업데이트
  useEffect(() => {
    if (!controllerRef.current || !isReady || !data) return;
    controllerRef.current.setData(data);
  }, [data, isReady]);

  // 테마 업데이트
  useEffect(() => {
    if (!controllerRef.current || !isReady || !options?.theme) return;
    controllerRef.current.setTheme(options.theme);
  }, [options?.theme, isReady]);

  // Ref 핸들 노출
  useImperativeHandle(
    ref,
    () => ({
      controller: controllerRef.current,
      setData: (newData: OHLCV[]) => {
        controllerRef.current?.setData(newData);
      },
      appendData: (candles: OHLCV[]) => {
        controllerRef.current?.appendData(candles);
      },
      updateLastCandle: (candle: OHLCV) => {
        controllerRef.current?.updateLastCandle(candle);
      },
      setTheme: (theme: 'light' | 'dark') => {
        controllerRef.current?.setTheme(theme);
      },
      computeIndicator: async (
        indicator: 'SMA' | 'EMA' | 'RSI' | 'MACD' | 'BB',
        params: Record<string, number>
      ) => {
        if (!controllerRef.current) {
          throw new Error('Chart not initialized');
        }
        return controllerRef.current.computeIndicator(indicator, params);
      },
      resetView: () => {
        // 더블클릭 이벤트를 프로그래매틱하게 트리거
        const event = new MouseEvent('dblclick', {
          bubbles: true,
          cancelable: true,
          view: window,
        });
        containerRef.current?.dispatchEvent(event);
      },
    }),
    [isReady]
  );

  // 컨테이너 스타일
  const containerStyle: React.CSSProperties = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
    position: 'relative',
    overflow: 'hidden',
    ...style,
  };

  return <div ref={containerRef} className={className} style={containerStyle} />;
});

Chart.displayName = 'Chart';

export default Chart;
