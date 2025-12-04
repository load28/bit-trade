/**
 * BitChart - Chart Formatters
 * 차트 데이터 포맷팅 유틸리티
 */

/**
 * 가격 포맷팅
 */
export function formatPrice(price: number): string {
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
 * 시간 포맷팅 (짧은 형식)
 */
export function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * 날짜/시간 포맷팅 (긴 형식)
 */
export function formatDateTime(timestamp: number): string {
  const date = new Date(timestamp);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${month}/${day} ${hours}:${minutes}`;
}

/**
 * 볼륨 포맷팅
 */
export function formatVolume(volume: number): string {
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
 * 날짜만 포맷팅
 */
export function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 퍼센트 포맷팅
 */
export function formatPercent(value: number, decimals: number = 2): string {
  if (!Number.isFinite(value)) return '-';
  return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * 퍼센트 변화 포맷팅 (부호 포함)
 */
export function formatPercentChange(value: number, decimals: number = 2): string {
  if (!Number.isFinite(value)) return '-';
  const sign = value >= 0 ? '+' : '';
  return `${sign}${(value * 100).toFixed(decimals)}%`;
}
