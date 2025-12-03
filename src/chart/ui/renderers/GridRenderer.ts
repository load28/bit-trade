/**
 * BitChart - Grid Renderer
 * 그리드 라인 렌더링
 */

import type { TimeScale } from '../../scale/TimeScale';
import type { PriceScale } from '../../scale/PriceScale';

/**
 * 그리드 렌더링
 */
export function renderGrid(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  timeScale: TimeScale,
  priceScale: PriceScale,
  gridColor: string
): void {
  ctx.strokeStyle = gridColor;
  ctx.lineWidth = 1;

  // 수평 그리드 (가격)
  const gridPrices = priceScale.getGridPrices(6);
  for (const price of gridPrices) {
    const py = y + priceScale.priceToNormalized(price) * height;
    ctx.beginPath();
    ctx.moveTo(x, py);
    ctx.lineTo(x + width, py);
    ctx.stroke();
  }

  // 수직 그리드 (시간)
  const gridTimes = timeScale.getGridTimes(8);
  for (const time of gridTimes) {
    const px = x + timeScale.timeToNormalized(time) * width;
    ctx.beginPath();
    ctx.moveTo(px, y);
    ctx.lineTo(px, y + height);
    ctx.stroke();
  }
}
