/**
 * @description Quartz 周字段约定（与 cron.ren 一致）：
 * 1=周日，2=周一，…，7=周六；0 也表示周日。
 * 英文：SUN, MON, TUE, WED, THU, FRI, SAT
 * JS Date.getDay()：0=周日，1=周一，…，6=周六。
 */

export type { WeekFormat } from './types';

/** @description Quartz 周数字 → 中文全称（用于 UI 格子） */
export const QUARTZ_WEEK_LABELS: Record<number, string> = {
  0: '星期天',
  1: '星期天',
  2: '星期一',
  3: '星期二',
  4: '星期三',
  5: '星期四',
  6: '星期五',
  7: '星期六',
};

/** @description Quartz 周数字 → 英文缩写 */
export const QUARTZ_WEEK_ABBR: Record<number, string> = {
  0: 'SUN',
  1: 'SUN',
  2: 'MON',
  3: 'TUE',
  4: 'WED',
  5: 'THU',
  6: 'FRI',
  7: 'SAT',
};

/** @description 英文缩写 → Quartz 周数字（1=周日） */
export const QUARTZ_WEEK_ABBR_TO_NUM: Record<string, number> = {
  SUN: 1,
  MON: 2,
  TUE: 3,
  WED: 4,
  THU: 5,
  FRI: 6,
  SAT: 7,
};

/**
 * @description cron.ren「指定」格子顺序：周一 → 周日
 */
export const QUARTZ_WEEK_UI_ORDER = [2, 3, 4, 5, 6, 7, 1] as const;

/**
 * @description Quartz 周数字转短中文（日/一/…/六）
 * @param {number | string} quartzDay - Quartz 周数字（0-7）
 * @returns {string} 短标签；非法则返回原值字符串
 */
export function quartzWeekShortLabel(quartzDay: number | string): string {
  const n = typeof quartzDay === 'number' ? quartzDay : Number(quartzDay);
  const shorts = ['日', '日', '一', '二', '三', '四', '五', '六'] as const;
  if (!Number.isFinite(n)) return String(quartzDay);
  const i = Math.trunc(n);
  if (i < 0 || i > 7) return String(quartzDay);
  return shorts[i];
}

/**
 * @description Quartz 周数字 → 英文缩写
 * @param {number | string} quartzDay - 周数字
 * @returns {string} SUN…SAT；非法则返回原字符串
 */
export function weekNumberToAbbr(quartzDay: number | string): string {
  const n = typeof quartzDay === 'number' ? quartzDay : Number(quartzDay);
  if (!Number.isFinite(n)) return String(quartzDay);
  const i = Math.trunc(n);
  return QUARTZ_WEEK_ABBR[i] ?? String(quartzDay);
}

/**
 * @description 英文缩写 → Quartz 周数字
 * @param {string} abbr - SUN…SAT
 * @returns {number | null} 1-7；无法识别返回 null
 */
export function weekAbbrToNumber(abbr: string): number | null {
  if (!abbr) return null;
  const key = abbr.trim().toUpperCase();
  return QUARTZ_WEEK_ABBR_TO_NUM[key] ?? null;
}

/**
 * @description 将周字段中的英文缩写归一为数字（解析前置处理）
 * @param {string} raw - 原始周字段（可含 SUN、MON-FRI、FRI#2、FRIL）
 * @returns {string} 数字形式字段串
 * @example
 * normalizeWeekFieldToken('MON-FRI'); // '2-6'
 * normalizeWeekFieldToken('FRI#2'); // '6#2'
 */
export function normalizeWeekFieldToken(raw: string): string {
  if (!raw) return raw;
  let t = raw.trim();

  t = t.replace(/\b(SUN|MON|TUE|WED|THU|FRI|SAT)#(\d+)\b/gi, (_, name: string, n: string) => {
    return `${weekAbbrToNumber(name)}#${n}`;
  });

  t = t.replace(/\b(SUN|MON|TUE|WED|THU|FRI|SAT)L\b/gi, (_, name: string) => {
    return `${weekAbbrToNumber(name)}L`;
  });

  t = t.replace(
    /\b(SUN|MON|TUE|WED|THU|FRI|SAT)-(SUN|MON|TUE|WED|THU|FRI|SAT)\b/gi,
    (_, a: string, b: string) => `${weekAbbrToNumber(a)}-${weekAbbrToNumber(b)}`,
  );

  t = t.replace(/\b(SUN|MON|TUE|WED|THU|FRI|SAT)\b/gi, (name: string) =>
    String(weekAbbrToNumber(name)),
  );

  return t;
}

/**
 * @description 判断 JS 星期是否命中 Quartz 周字段候选集
 * @param {number} jsDay - Date.getDay()（0=周日 … 6=周六）
 * @param {number[]} quartzWeeks - Quartz 周数字列表
 * @returns {boolean} 是否匹配
 */
export function matchesQuartzWeek(jsDay: number, quartzWeeks: number[]): boolean {
  if (!Array.isArray(quartzWeeks) || quartzWeeks.length === 0) return false;
  if (jsDay === 0) {
    return quartzWeeks.includes(0) || quartzWeeks.includes(1);
  }
  return quartzWeeks.includes(jsDay + 1);
}

/**
 * @description 周字段 token 是否使用英文缩写写法（SUN…SAT）
 * @param {string} weekToken - 周字段原始串（如 `MON-FRI`、`6L`、`FRIL`、`?`）
 * @returns {boolean} 含星期英文缩写则为 true；`6L` / `L` / `#` 等不含缩写时为 false
 * @example
 * weekTokenUsesAbbr('MON-FRI'); // true
 * weekTokenUsesAbbr('FRIL'); // true
 * weekTokenUsesAbbr('6L'); // false（L 是特殊符，不是 abbr）
 * weekTokenUsesAbbr('6#3'); // false
 */
export function weekTokenUsesAbbr(weekToken: string): boolean {
  if (!weekToken) return false;
  // 不用 \b：FRIL / FRI#2 中 FRI 后紧跟 L/#，词边界会失效
  return /(SUN|MON|TUE|WED|THU|FRI|SAT)/i.test(weekToken.trim());
}

/**
 * @description 判断 token 是否像「年」字段（用于 6 段表达式启发式）
 * @param {string} token - 字段原始串
 * @returns {boolean} 是否像年
 */
export function isYearLikeToken(token: string): boolean {
  if (!token || token === '*' || token === '?') return false;
  if (/^\d{4}$/.test(token)) {
    const y = Number(token);
    return y >= 1970 && y <= 2099;
  }
  if (/^\d{4}-\d{4}$/.test(token)) {
    const [a, b] = token.split('-').map(Number);
    return a >= 1970 && a <= 2099 && b >= 1970 && b <= 2099 && a <= b;
  }
  if (/^\d{4}\/\d+$/.test(token)) {
    const y = Number(token.split('/')[0]);
    return y >= 1970 && y <= 2099;
  }
  if (/^\*\/\d+$/.test(token)) {
    return false;
  }
  return false;
}
