/**
 * BitChart - useRealtimeData Hook
 * 실시간 데이터 연결 관리
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { OHLCV } from '../../types/data';
import {
  RealtimeDataHandler,
  type RealtimeEvent,
  type RealtimeHandlerOptions,
} from '../../realtime/RealtimeDataHandler';

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
