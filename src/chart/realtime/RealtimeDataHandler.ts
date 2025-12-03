/**
 * BitChart - Realtime Data Handler
 * WebSocket 기반 실시간 데이터 처리
 *
 * Features:
 * - WebSocket 연결 관리
 * - 자동 재연결
 * - 데이터 버퍼링 및 배치 업데이트
 * - 캔들 집계 (틱 → 캔들)
 */

import type { OHLCV, Tick } from '../types/data';

/** 실시간 핸들러 옵션 */
export interface RealtimeHandlerOptions {
  /** WebSocket URL */
  url?: string;
  /** 자동 재연결 */
  autoReconnect?: boolean;
  /** 재연결 딜레이 (ms) */
  reconnectDelay?: number;
  /** 최대 재연결 시도 */
  maxReconnectAttempts?: number;
  /** 배치 업데이트 간격 (ms) */
  batchInterval?: number;
  /** 캔들 타임프레임 (ms) */
  candleTimeframe?: number;
}

/** 연결 상태 */
export type ConnectionState =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'error';

/** 실시간 이벤트 */
export interface RealtimeEvent {
  type: 'connect' | 'disconnect' | 'tick' | 'candle' | 'error' | 'batch';
  data?: unknown;
  error?: Error;
}

/** 실시간 이벤트 리스너 */
export type RealtimeEventListener = (event: RealtimeEvent) => void;

/** 메시지 파서 */
export type MessageParser = (data: unknown) => Tick | Tick[] | null;

/**
 * 실시간 데이터 핸들러 클래스
 */
export class RealtimeDataHandler {
  private ws: WebSocket | null = null;
  private options: Required<RealtimeHandlerOptions>;
  private state: ConnectionState = 'disconnected';
  private listeners: Set<RealtimeEventListener> = new Set();

  // 재연결
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  // 배치 버퍼
  private tickBuffer: Tick[] = [];
  private batchTimer: ReturnType<typeof setInterval> | null = null;

  // 캔들 집계
  private currentCandle: OHLCV | null = null;
  private candleStartTime = 0;

  // 메시지 파서
  private messageParser: MessageParser;

  constructor(options: RealtimeHandlerOptions = {}) {
    this.options = {
      url: options.url ?? '',
      autoReconnect: options.autoReconnect ?? true,
      reconnectDelay: options.reconnectDelay ?? 3000,
      maxReconnectAttempts: options.maxReconnectAttempts ?? 10,
      batchInterval: options.batchInterval ?? 100,
      candleTimeframe: options.candleTimeframe ?? 60000, // 1분
    };

    // 기본 파서
    this.messageParser = this.defaultParser.bind(this);
  }

  /**
   * 메시지 파서 설정
   */
  setMessageParser(parser: MessageParser): void {
    this.messageParser = parser;
  }

  /**
   * WebSocket 연결
   */
  connect(url?: string): void {
    if (url) {
      this.options.url = url;
    }

    if (!this.options.url) {
      throw new Error('WebSocket URL not provided');
    }

    if (this.ws) {
      this.disconnect();
    }

    this.setState('connecting');

    try {
      this.ws = new WebSocket(this.options.url);
      this.setupWebSocketHandlers();
    } catch (error) {
      this.handleError(error as Error);
    }
  }

  /**
   * WebSocket 핸들러 설정
   */
  private setupWebSocketHandlers(): void {
    if (!this.ws) return;

    this.ws.onopen = () => {
      this.setState('connected');
      this.reconnectAttempts = 0;
      this.startBatchTimer();
      this.notifyListeners({ type: 'connect' });
    };

    this.ws.onclose = (event) => {
      this.stopBatchTimer();

      if (event.wasClean) {
        this.setState('disconnected');
        this.notifyListeners({ type: 'disconnect' });
      } else {
        this.handleDisconnect();
      }
    };

    this.ws.onerror = (event) => {
      this.handleError(new Error('WebSocket error'));
    };

    this.ws.onmessage = (event) => {
      this.handleMessage(event.data);
    };
  }

  /**
   * 메시지 처리
   */
  private handleMessage(data: unknown): void {
    try {
      let parsed: unknown;

      if (typeof data === 'string') {
        parsed = JSON.parse(data);
      } else if (data instanceof Blob) {
        // Blob은 비동기 처리 필요
        data.text().then((text) => {
          this.handleMessage(text);
        });
        return;
      } else {
        parsed = data;
      }

      const ticks = this.messageParser(parsed);

      if (ticks) {
        if (Array.isArray(ticks)) {
          ticks.forEach((tick) => this.processTick(tick));
        } else {
          this.processTick(ticks);
        }
      }
    } catch (error) {
      console.warn('Failed to parse message:', error);
    }
  }

  /**
   * 틱 처리
   */
  private processTick(tick: Tick): void {
    // 버퍼에 추가
    this.tickBuffer.push(tick);

    // 틱 이벤트 발생
    this.notifyListeners({ type: 'tick', data: tick });

    // 캔들 업데이트
    this.updateCandle(tick);
  }

  /**
   * 캔들 업데이트/집계
   */
  private updateCandle(tick: Tick): void {
    const candleTime =
      Math.floor(tick.time / this.options.candleTimeframe) *
      this.options.candleTimeframe;

    if (!this.currentCandle || candleTime !== this.candleStartTime) {
      // 이전 캔들 완료
      if (this.currentCandle) {
        this.notifyListeners({ type: 'candle', data: { ...this.currentCandle } });
      }

      // 새 캔들 시작
      this.candleStartTime = candleTime;
      this.currentCandle = {
        time: candleTime,
        open: tick.price,
        high: tick.price,
        low: tick.price,
        close: tick.price,
        volume: tick.volume ?? 0,
      };
    } else {
      // 기존 캔들 업데이트
      this.currentCandle.high = Math.max(this.currentCandle.high, tick.price);
      this.currentCandle.low = Math.min(this.currentCandle.low, tick.price);
      this.currentCandle.close = tick.price;
      this.currentCandle.volume += tick.volume ?? 0;
    }
  }

  /**
   * 배치 타이머 시작
   */
  private startBatchTimer(): void {
    if (this.batchTimer) return;

    this.batchTimer = setInterval(() => {
      if (this.tickBuffer.length > 0) {
        const batch = [...this.tickBuffer];
        this.tickBuffer = [];
        this.notifyListeners({ type: 'batch', data: batch });
      }

      // 현재 캔들 업데이트 전송
      if (this.currentCandle) {
        this.notifyListeners({
          type: 'candle',
          data: { ...this.currentCandle, isPartial: true },
        });
      }
    }, this.options.batchInterval);
  }

  /**
   * 배치 타이머 중지
   */
  private stopBatchTimer(): void {
    if (this.batchTimer) {
      clearInterval(this.batchTimer);
      this.batchTimer = null;
    }
  }

  /**
   * 연결 끊김 처리
   */
  private handleDisconnect(): void {
    if (!this.options.autoReconnect) {
      this.setState('disconnected');
      this.notifyListeners({ type: 'disconnect' });
      return;
    }

    if (this.reconnectAttempts >= this.options.maxReconnectAttempts) {
      this.setState('error');
      this.notifyListeners({
        type: 'error',
        error: new Error('Max reconnection attempts reached'),
      });
      return;
    }

    this.setState('reconnecting');
    this.reconnectAttempts++;

    // 지수 백오프
    const delay =
      this.options.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, Math.min(delay, 30000));
  }

  /**
   * 에러 처리
   */
  private handleError(error: Error): void {
    this.setState('error');
    this.notifyListeners({ type: 'error', error });

    if (this.options.autoReconnect) {
      this.handleDisconnect();
    }
  }

  /**
   * 상태 변경
   */
  private setState(state: ConnectionState): void {
    this.state = state;
  }

  /**
   * 연결 해제
   */
  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.stopBatchTimer();

    if (this.ws) {
      this.ws.onclose = null; // 재연결 방지
      this.ws.close();
      this.ws = null;
    }

    this.setState('disconnected');
  }

  /**
   * 메시지 전송
   */
  send(data: unknown): void {
    if (!this.ws || this.state !== 'connected') {
      throw new Error('WebSocket not connected');
    }

    const message = typeof data === 'string' ? data : JSON.stringify(data);
    this.ws.send(message);
  }

  /**
   * 구독 (프로토콜별 구현 필요)
   */
  subscribe(symbol: string, channel?: string): void {
    this.send({
      type: 'subscribe',
      symbol,
      channel: channel ?? 'trade',
    });
  }

  /**
   * 구독 해제
   */
  unsubscribe(symbol: string, channel?: string): void {
    this.send({
      type: 'unsubscribe',
      symbol,
      channel: channel ?? 'trade',
    });
  }

  /**
   * 현재 상태
   */
  getState(): ConnectionState {
    return this.state;
  }

  /**
   * 현재 진행 중인 캔들
   */
  getCurrentCandle(): OHLCV | null {
    return this.currentCandle ? { ...this.currentCandle } : null;
  }

  /**
   * 이벤트 리스너 등록
   */
  addEventListener(listener: RealtimeEventListener): void {
    this.listeners.add(listener);
  }

  /**
   * 이벤트 리스너 제거
   */
  removeEventListener(listener: RealtimeEventListener): void {
    this.listeners.delete(listener);
  }

  /**
   * 리스너 알림
   */
  private notifyListeners(event: RealtimeEvent): void {
    this.listeners.forEach((listener) => {
      try {
        listener(event);
      } catch (e) {
        console.error('Realtime event listener error:', e);
      }
    });
  }

  /**
   * 기본 메시지 파서
   */
  private defaultParser(data: unknown): Tick | null {
    if (!data || typeof data !== 'object') return null;

    const obj = data as Record<string, unknown>;

    // 일반적인 틱 형식
    if ('price' in obj && 'time' in obj) {
      return {
        time: Number(obj.time),
        price: Number(obj.price),
        volume: obj.volume ? Number(obj.volume) : undefined,
        side: obj.side as 'buy' | 'sell' | undefined,
      };
    }

    // Binance 형식
    if ('p' in obj && 'T' in obj) {
      return {
        time: Number(obj.T),
        price: parseFloat(obj.p as string),
        volume: obj.q ? parseFloat(obj.q as string) : undefined,
        side: obj.m ? 'sell' : 'buy',
      };
    }

    return null;
  }

  /**
   * 정리
   */
  destroy(): void {
    this.disconnect();
    this.listeners.clear();
    this.tickBuffer = [];
    this.currentCandle = null;
  }
}

/**
 * Binance WebSocket 파서
 */
export function createBinanceParser(): MessageParser {
  return (data: unknown): Tick | null => {
    if (!data || typeof data !== 'object') return null;

    const obj = data as Record<string, unknown>;

    // Trade stream
    if (obj.e === 'trade') {
      return {
        time: Number(obj.T),
        price: parseFloat(obj.p as string),
        volume: parseFloat(obj.q as string),
        side: obj.m ? 'sell' : 'buy',
      };
    }

    // Aggregated trade stream
    if (obj.e === 'aggTrade') {
      return {
        time: Number(obj.T),
        price: parseFloat(obj.p as string),
        volume: parseFloat(obj.q as string),
        side: obj.m ? 'sell' : 'buy',
      };
    }

    return null;
  };
}

/**
 * 커스텀 WebSocket 파서 팩토리
 */
export function createCustomParser(config: {
  timeField: string;
  priceField: string;
  volumeField?: string;
  sideField?: string;
  timeMultiplier?: number;
}): MessageParser {
  return (data: unknown): Tick | null => {
    if (!data || typeof data !== 'object') return null;

    const obj = data as Record<string, unknown>;

    const time = obj[config.timeField];
    const price = obj[config.priceField];

    if (time === undefined || price === undefined) return null;

    return {
      time: Number(time) * (config.timeMultiplier ?? 1),
      price: Number(price),
      volume: config.volumeField ? Number(obj[config.volumeField]) : undefined,
      side: config.sideField
        ? (obj[config.sideField] as 'buy' | 'sell')
        : undefined,
    };
  };
}
