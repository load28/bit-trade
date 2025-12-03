/**
 * BitChart - Tooltip Renderer
 * 툴팁 렌더링
 */

import type { OHLCV } from '../../types/data';
import { formatPrice, formatVolume } from '../../core/formatters';

/** 툴팁 색상 옵션 */
export interface TooltipColors {
  background: string;
  border: string;
  textSecondary: string;
  up: string;
  down: string;
}

/** 툴팁 렌더러 옵션 */
export interface TooltipRendererOptions {
  fontFamily: string;
  fontSize: number;
  colors: TooltipColors;
}

/**
 * 둥근 사각형 그리기
 */
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
): void {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

/**
 * 툴팁 렌더링
 */
export function renderTooltip(
  ctx: CanvasRenderingContext2D,
  candle: OHLCV,
  chartLeft: number,
  chartTop: number,
  options: TooltipRendererOptions
): void {
  const { colors, fontFamily, fontSize } = options;
  const padding = 12;
  const lineHeight = 18;
  const labelWidth = 50;

  const isUp = candle.close >= candle.open;
  const priceColor = isUp ? colors.up : colors.down;

  // 툴팁 데이터
  const lines = [
    { label: 'O', value: formatPrice(candle.open) },
    { label: 'H', value: formatPrice(candle.high) },
    { label: 'L', value: formatPrice(candle.low) },
    { label: 'C', value: formatPrice(candle.close) },
    { label: 'V', value: formatVolume(candle.volume) },
  ];

  // 툴팁 크기 계산
  ctx.font = `${fontSize}px ${fontFamily}`;
  const maxValueWidth = Math.max(...lines.map((l) => ctx.measureText(l.value).width));
  const tooltipWidth = padding * 2 + labelWidth + maxValueWidth;
  const tooltipHeight = padding * 2 + lines.length * lineHeight;

  // 툴팁 위치 (차트 좌상단)
  const tooltipX = chartLeft + 10;
  const tooltipY = chartTop + 10;

  // 배경
  ctx.fillStyle = colors.background;
  ctx.strokeStyle = colors.border;
  ctx.lineWidth = 1;

  roundRect(ctx, tooltipX, tooltipY, tooltipWidth, tooltipHeight, 4);
  ctx.fill();
  ctx.stroke();

  // 텍스트
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';

  lines.forEach((line, i) => {
    const y = tooltipY + padding + i * lineHeight + lineHeight / 2;

    // 레이블
    ctx.fillStyle = colors.textSecondary;
    ctx.fillText(line.label, tooltipX + padding, y);

    // 값
    ctx.fillStyle = priceColor;
    ctx.fillText(line.value, tooltipX + padding + labelWidth, y);
  });
}
