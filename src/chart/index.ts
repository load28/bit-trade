/**
 * BitChart - Enterprise Trading Chart Library
 *
 * WebGL 2.0 + Web Worker 기반 고성능 트레이딩 차트
 *
 * Features:
 * - GPU Instanced Rendering (100만+ 캔들 60fps)
 * - Web Worker 렌더링 오프로드
 * - SharedArrayBuffer 제로카피 데이터 전송
 * - 하이브리드 렌더링 (WebGL + Canvas 2D)
 *
 * @example
 * ```typescript
 * import { ChartController } from '@/chart';
 *
 * // 간단한 사용법
 * const chart = new ChartController({ theme: 'dark' });
 * await chart.init('chart-container');
 * chart.setData(ohlcvData);
 *
 * // 이벤트 처리
 * chart.addEventListener((event) => {
 *   if (event.type === 'crosshair') {
 *     console.log('Crosshair:', event.data);
 *   }
 * });
 *
 * // 지표 계산
 * const sma = await chart.computeIndicator('SMA', { period: 20 });
 * ```
 *
 * @example
 * ```typescript
 * // 저수준 API 사용 (직접 WebGL 제어)
 * import { WebGLRenderer, CandlestickSeries, VolumeSeries } from '@/chart';
 *
 * const renderer = new WebGLRenderer(canvas);
 * const candlesticks = new CandlestickSeries(renderer);
 * const volume = new VolumeSeries(renderer);
 *
 * candlesticks.initialize();
 * volume.initialize();
 *
 * candlesticks.setData(ohlcvData);
 * volume.setData(ohlcvData);
 *
 * // Render loop
 * function render() {
 *   renderer.beginFrame();
 *   candlesticks.render(viewport);
 *   volume.render(viewport);
 *   renderer.endFrame();
 *   requestAnimationFrame(render);
 * }
 * ```
 */

// Core (High-level API)
export * from './core';

// Types
export * from './types';

// WebGL (Low-level API)
export * from './webgl';

// Series
export * from './series';

// Scale
export * from './scale';

// Utils
export * from './utils';

// UI
export * from './ui';
