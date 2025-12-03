/**
 * BitChart - Format Utilities
 * 숫자 및 날짜 포맷팅 유틸리티
 */

/**
 * 가격 포맷팅
 */
export function formatPrice(
  price: number,
  precision: number = 2,
  locale: string = 'en-US'
): string {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  }).format(price);
}

/**
 * 거래량 포맷팅 (K, M, B 단위)
 */
export function formatVolume(volume: number, locale: string = 'en-US'): string {
  if (volume >= 1_000_000_000) {
    return (volume / 1_000_000_000).toFixed(2) + 'B';
  }
  if (volume >= 1_000_000) {
    return (volume / 1_000_000).toFixed(2) + 'M';
  }
  if (volume >= 1_000) {
    return (volume / 1_000).toFixed(2) + 'K';
  }
  return new Intl.NumberFormat(locale, {
    maximumFractionDigits: 2,
  }).format(volume);
}

/**
 * 퍼센트 포맷팅
 */
export function formatPercent(
  value: number,
  precision: number = 2,
  showSign: boolean = true
): string {
  const formatted = Math.abs(value).toFixed(precision);
  const sign = value >= 0 ? '+' : '-';
  return (showSign ? sign : '') + formatted + '%';
}

/**
 * 날짜 포맷팅 옵션
 */
export interface DateFormatOptions {
  /** 연도 표시 */
  showYear?: boolean;
  /** 월 표시 */
  showMonth?: boolean;
  /** 일 표시 */
  showDay?: boolean;
  /** 시간 표시 */
  showTime?: boolean;
  /** 초 표시 */
  showSeconds?: boolean;
  /** 24시간 형식 */
  hour24?: boolean;
  /** 로케일 */
  locale?: string;
}

/**
 * 타임스탬프를 날짜 문자열로 포맷팅
 */
export function formatDate(
  timestamp: number,
  options: DateFormatOptions = {}
): string {
  const {
    showYear = true,
    showMonth = true,
    showDay = true,
    showTime = false,
    showSeconds = false,
    hour24 = true,
    locale = 'en-US',
  } = options;

  const date = new Date(timestamp);
  const parts: string[] = [];

  // 날짜 부분
  if (showYear || showMonth || showDay) {
    const dateParts: string[] = [];
    if (showYear) dateParts.push(date.getFullYear().toString());
    if (showMonth) dateParts.push((date.getMonth() + 1).toString().padStart(2, '0'));
    if (showDay) dateParts.push(date.getDate().toString().padStart(2, '0'));
    parts.push(dateParts.join('-'));
  }

  // 시간 부분
  if (showTime) {
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');

    let timePart: string;
    if (hour24) {
      timePart = `${hours.toString().padStart(2, '0')}:${minutes}`;
    } else {
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12;
      timePart = `${hours}:${minutes} ${ampm}`;
    }

    if (showSeconds) {
      timePart = timePart.replace(minutes, `${minutes}:${seconds}`);
    }

    parts.push(timePart);
  }

  return parts.join(' ');
}

/**
 * 축 라벨용 시간 포맷팅 (범위에 따라 자동 조절)
 */
export function formatTimeForAxis(
  timestamp: number,
  rangeMs: number,
  locale: string = 'en-US'
): string {
  const MINUTE = 60 * 1000;
  const HOUR = 60 * MINUTE;
  const DAY = 24 * HOUR;
  const MONTH = 30 * DAY;
  const YEAR = 365 * DAY;

  const date = new Date(timestamp);

  // 1일 미만: 시:분
  if (rangeMs < DAY) {
    return formatDate(timestamp, { showYear: false, showMonth: false, showDay: false, showTime: true });
  }

  // 1개월 미만: 월-일
  if (rangeMs < MONTH) {
    return formatDate(timestamp, { showYear: false, showMonth: true, showDay: true });
  }

  // 1년 미만: 연-월
  if (rangeMs < YEAR) {
    return formatDate(timestamp, { showYear: true, showMonth: true, showDay: false });
  }

  // 1년 이상: 연-월
  return formatDate(timestamp, { showYear: true, showMonth: true, showDay: false });
}

/**
 * 툴팁용 시간 포맷팅 (전체 정보)
 */
export function formatTimeForTooltip(timestamp: number, locale: string = 'en-US'): string {
  return formatDate(timestamp, {
    showYear: true,
    showMonth: true,
    showDay: true,
    showTime: true,
    showSeconds: false,
    hour24: true,
    locale,
  });
}

/**
 * 숫자를 축약형으로 포맷팅 (1K, 1M, 1B)
 */
export function formatCompact(value: number, locale: string = 'en-US'): string {
  return new Intl.NumberFormat(locale, {
    notation: 'compact',
    compactDisplay: 'short',
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * 가격 변동을 문자열로 포맷팅
 */
export function formatPriceChange(
  open: number,
  close: number,
  precision: number = 2
): { value: string; percent: string; isPositive: boolean } {
  const change = close - open;
  const percentChange = ((close - open) / open) * 100;
  const isPositive = change >= 0;

  return {
    value: (isPositive ? '+' : '') + change.toFixed(precision),
    percent: formatPercent(percentChange, 2, true),
    isPositive,
  };
}

/**
 * 숫자의 유효 소수점 자릿수 계산
 */
export function getDecimalPlaces(value: number): number {
  if (Math.floor(value) === value) return 0;
  const str = value.toString();
  const dotIndex = str.indexOf('.');
  if (dotIndex === -1) return 0;
  return str.length - dotIndex - 1;
}

/**
 * 가격에 적합한 정밀도 자동 계산
 */
export function calculatePricePrecision(price: number): number {
  if (price >= 1000) return 2;
  if (price >= 100) return 2;
  if (price >= 10) return 3;
  if (price >= 1) return 4;
  if (price >= 0.1) return 5;
  if (price >= 0.01) return 6;
  if (price >= 0.001) return 7;
  return 8;
}
