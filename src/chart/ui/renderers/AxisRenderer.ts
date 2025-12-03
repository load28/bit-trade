/**
 * BitChart - Axis Renderer
 * 축 레이블 렌더링
 */

import type { TimeScale } from '../../scale/TimeScale';
import type { PriceScale } from '../../scale/PriceScale';
import { formatPrice, formatTime } from '../../core/formatters';

/** 축 렌더러 옵션 */
export interface AxisRendererOptions {
  fontFamily: string;
  fontSize: number;
  textColor: string;
}

/**
 * 가격 축 렌더링
 */
export function renderPriceAxis(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  height: number,
  priceScale: PriceScale,
  options: AxisRendererOptions
): void {
  const gridPrices = priceScale.getGridPrices(6);

  ctx.font = `${options.fontSize}px ${options.fontFamily}`;
  ctx.fillStyle = options.textColor;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';

  for (const price of gridPrices) {
    const py = y + priceScale.priceToNormalized(price) * height;
    ctx.fillText(formatPrice(price), x + 8, py);
  }
}

/**
 * 시간 축 렌더링
 */
export function renderTimeAxis(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  timeScale: TimeScale,
  options: AxisRendererOptions
): void {
  const gridTimes = timeScale.getGridTimes(8);

  ctx.font = `${options.fontSize}px ${options.fontFamily}`;
  ctx.fillStyle = options.textColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';

  for (const time of gridTimes) {
    const px = x + timeScale.timeToNormalized(time) * width;
    ctx.fillText(formatTime(time), px, y + 8);
  }
}
