/**
 * BitChart - Crosshair Renderer
 * 크로스헤어 렌더링
 */

import type { TimeScale } from '../../scale/TimeScale';
import type { PriceScale } from '../../scale/PriceScale';
import { formatPrice, formatDateTime } from '../../core/formatters';

/** 크로스헤어 색상 옵션 */
export interface CrosshairColors {
  line: string;
  labelBg: string;
  labelText: string;
}

/** 크로스헤어 스타일 옵션 */
export interface CrosshairRendererOptions {
  fontFamily: string;
  fontSize: number;
  colors: CrosshairColors;
}

/**
 * 크로스헤어 렌더링
 */
export function renderCrosshair(
  ctx: CanvasRenderingContext2D,
  mouseX: number,
  mouseY: number,
  chartLeft: number,
  chartTop: number,
  chartWidth: number,
  chartHeight: number,
  timeScale: TimeScale,
  priceScale: PriceScale,
  options: CrosshairRendererOptions
): void {
  // 차트 영역 외부면 스킵
  if (
    mouseX < chartLeft ||
    mouseX > chartLeft + chartWidth ||
    mouseY < chartTop ||
    mouseY > chartTop + chartHeight
  ) {
    return;
  }

  const { colors, fontFamily, fontSize } = options;

  // 점선 설정
  ctx.strokeStyle = colors.line;
  ctx.setLineDash([4, 4]);
  ctx.lineWidth = 1;

  // 수평선
  ctx.beginPath();
  ctx.moveTo(chartLeft, mouseY);
  ctx.lineTo(chartLeft + chartWidth, mouseY);
  ctx.stroke();

  // 수직선
  ctx.beginPath();
  ctx.moveTo(mouseX, chartTop);
  ctx.lineTo(mouseX, chartTop + chartHeight);
  ctx.stroke();

  ctx.setLineDash([]);

  // 가격 레이블
  const normalizedY = (mouseY - chartTop) / chartHeight;
  const price = priceScale.normalizedToPrice(normalizedY);
  const priceText = formatPrice(price);
  ctx.font = `${fontSize}px ${fontFamily}`;
  const priceLabelWidth = ctx.measureText(priceText).width + 16;

  ctx.fillStyle = colors.labelBg;
  ctx.fillRect(chartLeft + chartWidth, mouseY - 10, priceLabelWidth, 20);

  ctx.fillStyle = colors.labelText;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(priceText, chartLeft + chartWidth + 8, mouseY);

  // 시간 레이블
  const normalizedX = (mouseX - chartLeft) / chartWidth;
  const time = timeScale.normalizedToTime(normalizedX);
  const timeText = formatDateTime(time);
  const timeLabelWidth = ctx.measureText(timeText).width + 16;

  ctx.fillStyle = colors.labelBg;
  ctx.fillRect(mouseX - timeLabelWidth / 2, chartTop + chartHeight, timeLabelWidth, 20);

  ctx.fillStyle = colors.labelText;
  ctx.textAlign = 'center';
  ctx.fillText(timeText, mouseX, chartTop + chartHeight + 10);
}
