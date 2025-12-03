/**
 * BitChart - UI Renderer
 * Canvas 2D 기반 UI 요소 렌더링
 *
 * Features:
 * - 축 레이블
 * - 그리드 라인
 * - 크로스헤어
 * - 툴팁
 */

import type { TimeScale } from '../scale/TimeScale';
import type { PriceScale } from '../scale/PriceScale';
import type { OHLCV, CrosshairData as BaseCrosshairData } from '../types/data';
import type { ChartLayout } from '../types/chart';

/** UI 렌더러 옵션 */
export interface UIRendererOptions {
  /** 테마 */
  theme: 'light' | 'dark';
  /** 레이아웃 */
  layout: ChartLayout;
  /** 폰트 패밀리 */
  fontFamily?: string;
  /** 기본 폰트 크기 */
  fontSize?: number;
}

/** 크로스헤어 데이터 */
export interface CrosshairData extends BaseCrosshairData {
  candle?: OHLCV;
}

/** 테마 색상 */
interface ThemeColors {
  text: string;
  textSecondary: string;
  grid: string;
  crosshair: string;
  crosshairLabel: string;
  crosshairLabelText: string;
  tooltipBg: string;
  tooltipBorder: string;
  up: string;
  down: string;
}

const LIGHT_COLORS: ThemeColors = {
  text: '#333333',
  textSecondary: '#666666',
  grid: 'rgba(0, 0, 0, 0.08)',
  crosshair: 'rgba(0, 0, 0, 0.3)',
  crosshairLabel: '#2962ff',
  crosshairLabelText: '#ffffff',
  tooltipBg: 'rgba(255, 255, 255, 0.95)',
  tooltipBorder: 'rgba(0, 0, 0, 0.1)',
  up: '#26a69a',
  down: '#ef5350',
};

const DARK_COLORS: ThemeColors = {
  text: '#e0e0e0',
  textSecondary: '#b0b0b0',
  grid: 'rgba(255, 255, 255, 0.08)',
  crosshair: 'rgba(255, 255, 255, 0.4)',
  crosshairLabel: '#2962ff',
  crosshairLabelText: '#ffffff',
  tooltipBg: 'rgba(30, 30, 30, 0.95)',
  tooltipBorder: 'rgba(255, 255, 255, 0.1)',
  up: '#26a69a',
  down: '#ef5350',
};

/**
 * UI Renderer 클래스
 * Canvas 2D를 사용하여 UI 요소 렌더링
 */
export class UIRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private options: Required<UIRendererOptions>;
  private colors: ThemeColors;

  private timeScale: TimeScale | null = null;
  private priceScale: PriceScale | null = null;

  private width = 0;
  private height = 0;
  private dpr = 1;

  constructor(canvas: HTMLCanvasElement, options: UIRendererOptions) {
    this.canvas = canvas;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get 2D context');
    }
    this.ctx = ctx;

    this.options = {
      fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
      fontSize: 11,
      ...options,
    };

    this.colors = options.theme === 'dark' ? DARK_COLORS : LIGHT_COLORS;
    this.dpr = window.devicePixelRatio || 1;

    this.updateSize();
  }

  /**
   * 스케일 설정
   */
  setScales(timeScale: TimeScale, priceScale: PriceScale): void {
    this.timeScale = timeScale;
    this.priceScale = priceScale;
  }

  /**
   * 테마 설정
   */
  setTheme(theme: 'light' | 'dark'): void {
    this.options.theme = theme;
    this.colors = theme === 'dark' ? DARK_COLORS : LIGHT_COLORS;
  }

  /**
   * 크기 업데이트
   */
  updateSize(): void {
    this.dpr = window.devicePixelRatio || 1;
    this.width = this.canvas.width / this.dpr;
    this.height = this.canvas.height / this.dpr;
  }

  /**
   * 전체 클리어
   */
  clear(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  /**
   * 전체 UI 렌더링
   */
  render(crosshair: CrosshairData | null): void {
    this.ctx.save();
    this.ctx.scale(this.dpr, this.dpr);

    this.clear();

    const layout = this.options.layout;
    const padding = layout.padding!;
    const chartLeft = padding.left!;
    const chartTop = padding.top!;
    const chartWidth = this.width - padding.left! - padding.right!;
    const chartHeight = this.height - padding.top! - padding.bottom!;

    // 그리드 렌더링
    this.renderGrid(chartLeft, chartTop, chartWidth, chartHeight);

    // 축 레이블 렌더링
    this.renderPriceAxis(chartLeft + chartWidth, chartTop, chartHeight);
    this.renderTimeAxis(chartLeft, chartTop + chartHeight, chartWidth);

    // 크로스헤어 렌더링
    if (crosshair) {
      this.renderCrosshair(
        crosshair,
        chartLeft,
        chartTop,
        chartWidth,
        chartHeight
      );

      // 툴팁 렌더링
      if (crosshair.candle) {
        this.renderTooltip(crosshair, crosshair.candle, chartLeft, chartTop);
      }
    }

    this.ctx.restore();
  }

  /**
   * 그리드 렌더링
   */
  private renderGrid(
    x: number,
    y: number,
    width: number,
    height: number
  ): void {
    if (!this.timeScale || !this.priceScale) return;

    const ctx = this.ctx;

    ctx.strokeStyle = this.colors.grid;
    ctx.lineWidth = 1;

    // 수평 그리드 (가격)
    const gridPrices = this.priceScale.getGridPrices(6);
    for (const price of gridPrices) {
      const py = y + this.priceScale.priceToNormalized(price) * height;
      ctx.beginPath();
      ctx.moveTo(x, py);
      ctx.lineTo(x + width, py);
      ctx.stroke();
    }

    // 수직 그리드 (시간)
    const gridTimes = this.timeScale.getGridTimes(8);
    for (const time of gridTimes) {
      const px = x + this.timeScale.timeToNormalized(time) * width;
      ctx.beginPath();
      ctx.moveTo(px, y);
      ctx.lineTo(px, y + height);
      ctx.stroke();
    }
  }

  /**
   * 가격 축 렌더링
   */
  private renderPriceAxis(x: number, y: number, height: number): void {
    if (!this.priceScale) return;

    const ctx = this.ctx;
    const gridPrices = this.priceScale.getGridPrices(6);

    ctx.font = `${this.options.fontSize}px ${this.options.fontFamily}`;
    ctx.fillStyle = this.colors.textSecondary;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    for (const price of gridPrices) {
      const py = y + this.priceScale.priceToNormalized(price) * height;
      ctx.fillText(this.formatPrice(price), x + 8, py);
    }
  }

  /**
   * 시간 축 렌더링
   */
  private renderTimeAxis(x: number, y: number, width: number): void {
    if (!this.timeScale) return;

    const ctx = this.ctx;
    const gridTimes = this.timeScale.getGridTimes(8);

    ctx.font = `${this.options.fontSize}px ${this.options.fontFamily}`;
    ctx.fillStyle = this.colors.textSecondary;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    for (const time of gridTimes) {
      const px = x + this.timeScale.timeToNormalized(time) * width;
      ctx.fillText(this.formatTime(time), px, y + 8);
    }
  }

  /**
   * 크로스헤어 렌더링
   */
  private renderCrosshair(
    data: CrosshairData,
    chartLeft: number,
    chartTop: number,
    chartWidth: number,
    chartHeight: number
  ): void {
    const { x, y } = data;

    // 차트 영역 외부면 스킵
    if (
      x < chartLeft ||
      x > chartLeft + chartWidth ||
      y < chartTop ||
      y > chartTop + chartHeight
    ) {
      return;
    }

    const ctx = this.ctx;

    // 점선 설정
    ctx.strokeStyle = this.colors.crosshair;
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1;

    // 수평선
    ctx.beginPath();
    ctx.moveTo(chartLeft, y);
    ctx.lineTo(chartLeft + chartWidth, y);
    ctx.stroke();

    // 수직선
    ctx.beginPath();
    ctx.moveTo(x, chartTop);
    ctx.lineTo(x, chartTop + chartHeight);
    ctx.stroke();

    ctx.setLineDash([]);

    // 가격 레이블
    if (this.priceScale) {
      const normalizedY = (y - chartTop) / chartHeight;
      const price = this.priceScale.normalizedToPrice(normalizedY);
      const priceText = this.formatPrice(price);
      const labelWidth = ctx.measureText(priceText).width + 16;

      ctx.fillStyle = this.colors.crosshairLabel;
      ctx.fillRect(chartLeft + chartWidth, y - 10, labelWidth, 20);

      ctx.fillStyle = this.colors.crosshairLabelText;
      ctx.font = `${this.options.fontSize}px ${this.options.fontFamily}`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(priceText, chartLeft + chartWidth + 8, y);
    }

    // 시간 레이블
    if (this.timeScale) {
      const normalizedX = (x - chartLeft) / chartWidth;
      const time = this.timeScale.normalizedToTime(normalizedX);
      const timeText = this.formatDateTime(time);
      const labelWidth = ctx.measureText(timeText).width + 16;

      ctx.fillStyle = this.colors.crosshairLabel;
      ctx.fillRect(x - labelWidth / 2, chartTop + chartHeight, labelWidth, 20);

      ctx.fillStyle = this.colors.crosshairLabelText;
      ctx.textAlign = 'center';
      ctx.fillText(timeText, x, chartTop + chartHeight + 10);
    }
  }

  /**
   * 툴팁 렌더링
   */
  private renderTooltip(
    crosshair: CrosshairData,
    candle: OHLCV,
    chartLeft: number,
    chartTop: number
  ): void {
    const ctx = this.ctx;
    const padding = 12;
    const lineHeight = 18;
    const labelWidth = 50;

    const isUp = candle.close >= candle.open;
    const priceColor = isUp ? this.colors.up : this.colors.down;

    // 툴팁 데이터
    const lines = [
      { label: 'O', value: this.formatPrice(candle.open) },
      { label: 'H', value: this.formatPrice(candle.high) },
      { label: 'L', value: this.formatPrice(candle.low) },
      { label: 'C', value: this.formatPrice(candle.close) },
      { label: 'V', value: this.formatVolume(candle.volume) },
    ];

    // 툴팁 크기 계산
    ctx.font = `${this.options.fontSize}px ${this.options.fontFamily}`;
    const maxValueWidth = Math.max(...lines.map((l) => ctx.measureText(l.value).width));
    const tooltipWidth = padding * 2 + labelWidth + maxValueWidth;
    const tooltipHeight = padding * 2 + lines.length * lineHeight;

    // 툴팁 위치 (차트 좌상단)
    const tooltipX = chartLeft + 10;
    const tooltipY = chartTop + 10;

    // 배경
    ctx.fillStyle = this.colors.tooltipBg;
    ctx.strokeStyle = this.colors.tooltipBorder;
    ctx.lineWidth = 1;

    this.roundRect(ctx, tooltipX, tooltipY, tooltipWidth, tooltipHeight, 4);
    ctx.fill();
    ctx.stroke();

    // 텍스트
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    lines.forEach((line, i) => {
      const y = tooltipY + padding + i * lineHeight + lineHeight / 2;

      // 레이블
      ctx.fillStyle = this.colors.textSecondary;
      ctx.fillText(line.label, tooltipX + padding, y);

      // 값
      ctx.fillStyle = priceColor;
      ctx.fillText(line.value, tooltipX + padding + labelWidth, y);
    });
  }

  /**
   * 둥근 사각형 그리기
   */
  private roundRect(
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
   * 가격 포맷팅
   */
  private formatPrice(price: number): string {
    if (!Number.isFinite(price)) return '-';

    if (price >= 1000) {
      return price.toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      });
    }
    return price.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: price < 1 ? 6 : 2,
    });
  }

  /**
   * 볼륨 포맷팅
   */
  private formatVolume(volume: number): string {
    if (!Number.isFinite(volume)) return '-';

    if (volume >= 1e9) {
      return (volume / 1e9).toFixed(2) + 'B';
    }
    if (volume >= 1e6) {
      return (volume / 1e6).toFixed(2) + 'M';
    }
    if (volume >= 1e3) {
      return (volume / 1e3).toFixed(2) + 'K';
    }
    return volume.toFixed(2);
  }

  /**
   * 시간 포맷팅 (짧은 형식)
   */
  private formatTime(timestamp: number): string {
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  /**
   * 날짜/시간 포맷팅 (긴 형식)
   */
  private formatDateTime(timestamp: number): string {
    const date = new Date(timestamp);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${month}/${day} ${hours}:${minutes}`;
  }

  /**
   * 정리
   */
  destroy(): void {
    this.clear();
  }
}
