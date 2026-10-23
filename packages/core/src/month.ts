/**
 * @description Quartz / cron 月字段展示约定：1-12；英文缩写 JAN…DEC
 */

/** @description 月数字 → 中文标签（用于 UI「指定」格子） */
export const QUARTZ_MONTH_LABELS: Record<number, string> = {
  1: '1月',
  2: '2月',
  3: '3月',
  4: '4月',
  5: '5月',
  6: '6月',
  7: '7月',
  8: '8月',
  9: '9月',
  10: '10月',
  11: '11月',
  12: '12月',
};

/** @description 月数字 → 英文缩写 */
export const QUARTZ_MONTH_ABBR: Record<number, string> = {
  1: 'JAN',
  2: 'FEB',
  3: 'MAR',
  4: 'APR',
  5: 'MAY',
  6: 'JUN',
  7: 'JUL',
  8: 'AUG',
  9: 'SEP',
  10: 'OCT',
  11: 'NOV',
  12: 'DEC',
};

/** @description 英文缩写 → 月数字 */
export const QUARTZ_MONTH_ABBR_TO_NUM: Record<string, number> = {
  JAN: 1,
  FEB: 2,
  MAR: 3,
  APR: 4,
  MAY: 5,
  JUN: 6,
  JUL: 7,
  AUG: 8,
  SEP: 9,
  OCT: 10,
  NOV: 11,
  DEC: 12,
};

/**
 * @description 月数字 → 中文「n月」
 * @param {number | string} month - 1-12
 * @returns {string} 如「3月」；非法时回退原值字符串
 * @example
 * quartzMonthLabel(3); // '3月'
 */
export function quartzMonthLabel(month: number | string): string {
  const n = typeof month === 'number' ? month : Number(month);
  if (Number.isFinite(n) && QUARTZ_MONTH_LABELS[n]) {
    return QUARTZ_MONTH_LABELS[n];
  }
  return String(month);
}

/**
 * @description 月数字 → JAN…DEC
 * @param {number | string} month - 1-12
 * @returns {string} 英文缩写；非法时回退原值字符串
 * @example
 * monthNumberToAbbr(1); // 'JAN'
 */
export function monthNumberToAbbr(month: number | string): string {
  const n = typeof month === 'number' ? month : Number(month);
  if (Number.isFinite(n) && QUARTZ_MONTH_ABBR[n]) {
    return QUARTZ_MONTH_ABBR[n];
  }
  return String(month);
}

/**
 * @description 英文月缩写 → 1-12
 * @param {string} abbr - 如 JAN / jan
 * @returns {number | null} 月数字；无法识别返回 null
 * @example
 * monthAbbrToNumber('FEB'); // 2
 */
export function monthAbbrToNumber(abbr: string): number | null {
  const key = abbr.trim().toUpperCase();
  return QUARTZ_MONTH_ABBR_TO_NUM[key] ?? null;
}
