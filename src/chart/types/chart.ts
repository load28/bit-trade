/**
 * BitChart - Chart Types
 * 차트 설정 및 옵션 타입 정의
 */

import type { Timeframe, Viewport } from './data';

/** 차트 테마 */
export type ChartTheme = 'light' | 'dark';

/** 차트 색상 설정 */
export interface ChartColors {
  /** 상승 캔들 색상 */
  up: string;
  /** 하락 캔들 색상 */
  down: string;
  /** 배경색 */
  background: string;
  /** 그리드 색상 */
  grid: string;
  /** 축 색상 */
  axis: string;
  /** 텍스트 색상 */
  text: string;
  /** 크로스헤어 색상 */
  crosshair: string;
  /** 툴팁 배경색 */
  tooltipBackground: string;
  /** 툴팁 텍스트 색상 */
  tooltipText: string;
}

/** 기본 라이트 테마 색상 */
export const LIGHT_THEME_COLORS: ChartColors = {
  up: '#21C887',
  down: '#EF5350',
  background: '#FFFFFF',
  grid: '#E0E0E0',
  axis: '#9E9E9E',
  text: '#212121',
  crosshair: 'rgba(0, 0, 0, 0.3)',
  tooltipBackground: 'rgba(33, 33, 33, 0.9)',
  tooltipText: '#FFFFFF',
};

/** 기본 다크 테마 색상 */
export const DARK_THEME_COLORS: ChartColors = {
  up: '#21C887',
  down: '#EF5350',
  background: '#0D0D14',
  grid: '#1E1E2D',
  axis: '#4A4A5A',
  text: '#E0E0E0',
  crosshair: 'rgba(255, 255, 255, 0.3)',
  tooltipBackground: 'rgba(30, 30, 45, 0.95)',
  tooltipText: '#FFFFFF',
};

/** 레이아웃 설정 */
export interface ChartLayout {
  /** 차트 영역 패딩 */
  padding: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  /** 가격축 너비 */
  priceAxisWidth: number;
  /** 시간축 높이 */
  timeAxisHeight: number;
  /** 볼륨 차트 높이 비율 (0-1) */
  volumeHeightRatio: number;
}

/** 기본 레이아웃 */
export const DEFAULT_LAYOUT: ChartLayout = {
  padding: {
    top: 10,
    right: 0,
    bottom: 0,
    left: 0,
  },
  priceAxisWidth: 80,
  timeAxisHeight: 30,
  volumeHeightRatio: 0.2,
};

/** 캔들스틱 스타일 */
export interface CandlestickStyle {
  /** 캔들 너비 비율 (0-1) */
  widthRatio: number;
  /** 심지 너비 비율 (0-1) */
  wickWidthRatio: number;
  /** 최소 캔들 너비 (px) */
  minWidth: number;
  /** 최대 캔들 너비 (px) */
  maxWidth: number;
}

/** 기본 캔들스틱 스타일 */
export const DEFAULT_CANDLESTICK_STYLE: CandlestickStyle = {
  widthRatio: 0.8,
  wickWidthRatio: 0.1,
  minWidth: 1,
  maxWidth: 50,
};

/** 볼륨 스타일 */
export interface VolumeStyle {
  /** 바 너비 비율 (0-1) */
  widthRatio: number;
  /** 투명도 */
  opacity: number;
}

/** 기본 볼륨 스타일 */
export const DEFAULT_VOLUME_STYLE: VolumeStyle = {
  widthRatio: 0.8,
  opacity: 0.5,
};

/** 크로스헤어 설정 */
export interface CrosshairOptions {
  /** 활성화 여부 */
  enabled: boolean;
  /** 라인 스타일 */
  lineStyle: 'solid' | 'dashed' | 'dotted';
  /** 라인 너비 */
  lineWidth: number;
  /** 축 라벨 표시 */
  showAxisLabels: boolean;
}

/** 기본 크로스헤어 설정 */
export const DEFAULT_CROSSHAIR_OPTIONS: CrosshairOptions = {
  enabled: true,
  lineStyle: 'dashed',
  lineWidth: 1,
  showAxisLabels: true,
};

/** 줌/패닝 설정 */
export interface InteractionOptions {
  /** 줌 활성화 */
  zoomEnabled: boolean;
  /** 패닝 활성화 */
  panEnabled: boolean;
  /** 마우스 휠 줌 */
  wheelZoom: boolean;
  /** 핀치 줌 */
  pinchZoom: boolean;
  /** 줌 속도 */
  zoomSpeed: number;
  /** 최소 줌 레벨 */
  minZoom: number;
  /** 최대 줌 레벨 */
  maxZoom: number;
  /** 더블클릭 리셋 */
  doubleClickReset: boolean;
}

/** 기본 인터랙션 설정 */
export const DEFAULT_INTERACTION_OPTIONS: InteractionOptions = {
  zoomEnabled: true,
  panEnabled: true,
  wheelZoom: true,
  pinchZoom: true,
  zoomSpeed: 0.1,
  minZoom: 0.1,
  maxZoom: 100,
  doubleClickReset: true,
};

/** 성능 설정 */
export interface PerformanceOptions {
  /** 최대 캔들 수 (메모리 제한) */
  maxCandles: number;
  /** M4 데시메이션 활성화 */
  decimationEnabled: boolean;
  /** 데시메이션 임계값 (캔들 수) */
  decimationThreshold: number;
  /** Web Worker 사용 */
  useWorker: boolean;
  /** SharedArrayBuffer 사용 */
  useSharedMemory: boolean;
  /** 더블 버퍼링 */
  doubleBuffering: boolean;
}

/** 기본 성능 설정 */
export const DEFAULT_PERFORMANCE_OPTIONS: PerformanceOptions = {
  maxCandles: 100000,
  decimationEnabled: true,
  decimationThreshold: 5000,
  useWorker: true,
  useSharedMemory: true,
  doubleBuffering: true,
};

/** 차트 옵션 */
export interface ChartOptions {
  /** 너비 (auto = 컨테이너 크기) */
  width?: number | 'auto';
  /** 높이 (auto = 컨테이너 크기) */
  height?: number | 'auto';
  /** 테마 */
  theme?: ChartTheme;
  /** 색상 (테마 오버라이드) */
  colors?: Partial<ChartColors>;
  /** 레이아웃 */
  layout?: Partial<ChartLayout>;
  /** 타임프레임 */
  timeframe?: Timeframe;
  /** 캔들스틱 스타일 */
  candlestickStyle?: Partial<CandlestickStyle>;
  /** 볼륨 스타일 */
  volumeStyle?: Partial<VolumeStyle>;
  /** 크로스헤어 설정 */
  crosshair?: Partial<CrosshairOptions>;
  /** 인터랙션 설정 */
  interaction?: Partial<InteractionOptions>;
  /** 성능 설정 */
  performance?: Partial<PerformanceOptions>;
  /** 로케일 */
  locale?: string;
  /** 가격 정밀도 */
  pricePrecision?: number;
  /** 볼륨 차트 표시 */
  showVolume?: boolean;
  /** 그리드 표시 */
  showGrid?: boolean;
  /** 워터마크 */
  watermark?: string;
}

/** 차트 인스턴스 상태 */
export interface ChartState {
  /** 현재 뷰포트 */
  viewport: Viewport;
  /** 로딩 중 */
  isLoading: boolean;
  /** 에러 */
  error: Error | null;
  /** 현재 줌 레벨 */
  zoomLevel: number;
  /** 패닝 중 */
  isPanning: boolean;
  /** 크로스헤어 위치 */
  crosshairPosition: { x: number; y: number } | null;
  /** 호버된 캔들 인덱스 */
  hoveredCandleIndex: number | null;
}

/** 차트 이벤트 */
export interface ChartEvents {
  /** 크로스헤어 이동 */
  crosshairMove: (data: { x: number; y: number; price: number; time: number } | null) => void;
  /** 뷰포트 변경 */
  viewportChange: (viewport: Viewport) => void;
  /** 캔들 클릭 */
  candleClick: (index: number, candle: import('./data').OHLCV) => void;
  /** 줌 변경 */
  zoomChange: (level: number) => void;
  /** 로딩 상태 변경 */
  loadingChange: (isLoading: boolean) => void;
  /** 에러 발생 */
  error: (error: Error) => void;
}

/** 시리즈 타입 */
export type SeriesType = 'candlestick' | 'volume' | 'line' | 'area' | 'histogram';

/** 시리즈 기본 설정 */
export interface SeriesOptions {
  /** 시리즈 ID */
  id: string;
  /** 시리즈 타입 */
  type: SeriesType;
  /** 표시 여부 */
  visible: boolean;
  /** z-index */
  zIndex: number;
}

/** 지표 타입 */
export type IndicatorType = 'SMA' | 'EMA' | 'WMA' | 'BB' | 'RSI' | 'MACD' | 'VWAP';

/** 지표 설정 */
export interface IndicatorOptions {
  /** 지표 ID */
  id: string;
  /** 지표 타입 */
  type: IndicatorType;
  /** 파라미터 */
  params: Record<string, number>;
  /** 색상 */
  color: string;
  /** 선 너비 */
  lineWidth: number;
  /** 표시 여부 */
  visible: boolean;
}
