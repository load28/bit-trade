/**
 * BitChart - Data Types
 * 금융 차트를 위한 핵심 데이터 타입 정의
 */

/** OHLCV 캔들스틱 데이터 */
export interface OHLCV {
  /** Unix timestamp (milliseconds) */
  time: number;
  /** 시가 (Open) */
  open: number;
  /** 고가 (High) */
  high: number;
  /** 저가 (Low) */
  low: number;
  /** 종가 (Close) */
  close: number;
  /** 거래량 (Volume) */
  volume: number;
}

/** 실시간 틱 데이터 */
export interface Tick {
  /** Unix timestamp (milliseconds) */
  time: number;
  /** 가격 */
  price: number;
  /** 거래량 */
  volume: number;
  /** 매수/매도 */
  side: 'buy' | 'sell';
}

/** 호가창 레벨 */
export interface DepthLevel {
  /** 가격 */
  price: number;
  /** 수량 */
  quantity: number;
  /** 누적 수량 */
  total: number;
}

/** 호가창 데이터 */
export interface OrderBook {
  /** 매수 호가 */
  bids: DepthLevel[];
  /** 매도 호가 */
  asks: DepthLevel[];
  /** 타임스탬프 */
  timestamp: number;
}

/** 시간 범위 */
export interface TimeRange {
  /** 시작 시간 */
  from: number;
  /** 종료 시간 */
  to: number;
}

/** 가격 범위 */
export interface PriceRange {
  /** 최저가 */
  min: number;
  /** 최고가 */
  max: number;
}

/** 뷰포트 상태 */
export interface Viewport {
  /** 시간 범위 */
  timeRange: TimeRange;
  /** 가격 범위 */
  priceRange: PriceRange;
  /** 볼륨 범위 */
  volumeRange: PriceRange;
}

/** 크로스헤어 데이터 */
export interface CrosshairData {
  /** 스크린 X 좌표 */
  x: number;
  /** 스크린 Y 좌표 */
  y: number;
  /** 시간 */
  time: number;
  /** 가격 */
  price: number;
  /** 해당 캔들 데이터 */
  candle?: OHLCV;
}

/** 타임프레임 */
export type Timeframe =
  | '1m'
  | '3m'
  | '5m'
  | '15m'
  | '30m'
  | '1h'
  | '2h'
  | '4h'
  | '6h'
  | '12h'
  | '1d'
  | '1w'
  | '1M';

/** 타임프레임을 밀리초로 변환 */
export const TIMEFRAME_MS: Record<Timeframe, number> = {
  '1m': 60 * 1000,
  '3m': 3 * 60 * 1000,
  '5m': 5 * 60 * 1000,
  '15m': 15 * 60 * 1000,
  '30m': 30 * 60 * 1000,
  '1h': 60 * 60 * 1000,
  '2h': 2 * 60 * 60 * 1000,
  '4h': 4 * 60 * 60 * 1000,
  '6h': 6 * 60 * 60 * 1000,
  '12h': 12 * 60 * 60 * 1000,
  '1d': 24 * 60 * 60 * 1000,
  '1w': 7 * 24 * 60 * 60 * 1000,
  '1M': 30 * 24 * 60 * 60 * 1000,
};

/** GPU 버퍼용 Float32Array 데이터 레이아웃 */
export const CANDLE_FLOAT_SIZE = 6; // time, open, high, low, close, volume
export const CANDLE_BYTE_SIZE = CANDLE_FLOAT_SIZE * 4; // 24 bytes per candle
