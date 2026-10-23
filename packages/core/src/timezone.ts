/**
 * @description IANA 时区工具（仅依赖 Intl，无第三方库）
 */

/**
 * @description 分区墙上时钟组件（与 Cron 字段同语义）
 */
export interface ZonedParts {
  /** @description 年 */
  year: number;
  /** @description 月 1-12 */
  month: number;
  /** @description 日 1-31 */
  day: number;
  /** @description 时 0-23 */
  hour: number;
  /** @description 分 0-59 */
  minute: number;
  /** @description 秒 0-59 */
  second: number;
  /** @description JS 星期：0=周日 … 6=周六 */
  weekday: number;
}

const dtfCache = new Map<string, Intl.DateTimeFormat>();

/**
 * @description 校验 IANA 时区 ID
 * @param {string} timeZone - 如 Asia/Shanghai
 * @returns {boolean} 是否合法
 * @example
 * isValidTimeZone('Asia/Shanghai'); // true
 * isValidTimeZone('Not/AZone'); // false
 */
export function isValidTimeZone(timeZone: string): boolean {
  if (typeof timeZone !== 'string' || !timeZone.trim()) return false;
  try {
    Intl.DateTimeFormat('en-US', { timeZone: timeZone.trim() });
    return true;
  } catch {
    return false;
  }
}

/**
 * @description 获取（缓存）时区 DateTimeFormat
 * @param {string} timeZone - IANA
 * @returns {Intl.DateTimeFormat}
 */
function getDtf(timeZone: string): Intl.DateTimeFormat {
  let dtf = dtfCache.get(timeZone);
  if (!dtf) {
    dtf = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hour12: false,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      weekday: 'short',
    });
    dtfCache.set(timeZone, dtf);
  }
  return dtf;
}

const WEEKDAY_MAP: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

/**
 * @description 将 Date 转为指定时区的墙上时钟
 * @param {Date} date - 绝对时间
 * @param {string} timeZone - IANA
 * @returns {ZonedParts | null} 非法时区或 Date 返回 null
 * @example
 * getZonedParts(new Date('2026-01-01T00:00:00Z'), 'Asia/Shanghai');
 */
export function getZonedParts(date: Date, timeZone: string): ZonedParts | null {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return null;
  if (!isValidTimeZone(timeZone)) return null;
  const parts = getDtf(timeZone).formatToParts(date);
  const map: Record<string, string> = {};
  for (const p of parts) {
    if (p.type !== 'literal') map[p.type] = p.value;
  }
  let hour = Number(map.hour);
  // 部分引擎 24:00 → 记为 24
  if (hour === 24) hour = 0;
  const weekday = WEEKDAY_MAP[map.weekday ?? ''] ?? 0;
  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
    hour,
    minute: Number(map.minute),
    second: Number(map.second),
    weekday,
  };
}

/**
 * @description 将「时区墙上时钟」转为 UTC Date（处理 DST 偏移迭代）
 * @param {number} year - 年
 * @param {number} month - 月 1-12
 * @param {number} day - 日
 * @param {number} hour - 时
 * @param {number} minute - 分
 * @param {number} second - 秒
 * @param {string} timeZone - IANA
 * @returns {Date | null} 无法解析时返回 null
 * @example
 * zonedWallTimeToUtc(2026, 1, 1, 9, 0, 0, 'Asia/Shanghai');
 */
export function zonedWallTimeToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number,
  timeZone: string,
): Date | null {
  if (!isValidTimeZone(timeZone)) return null;
  if (
    ![year, month, day, hour, minute, second].every((n) => Number.isFinite(n))
  ) {
    return null;
  }

  // 初值：按 UTC 同数字猜测，再按时区显示差修正（通常 1～2 次收敛）
  let t = Date.UTC(year, month - 1, day, hour, minute, second);
  for (let i = 0; i < 4; i++) {
    const parts = getZonedParts(new Date(t), timeZone);
    if (!parts) return null;
    const asUtc = Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
      parts.second,
    );
    const want = Date.UTC(year, month - 1, day, hour, minute, second);
    const diff = want - asUtc;
    if (diff === 0) {
      const check = getZonedParts(new Date(t), timeZone);
      if (
        check &&
        check.year === year &&
        check.month === month &&
        check.day === day &&
        check.hour === hour &&
        check.minute === minute &&
        check.second === second
      ) {
        return new Date(t);
      }
      // DST 弹簧洞：该墙上时间不存在
      return null;
    }
    t += diff;
  }
  const final = getZonedParts(new Date(t), timeZone);
  if (
    final &&
    final.year === year &&
    final.month === month &&
    final.day === day &&
    final.hour === hour &&
    final.minute === minute &&
    final.second === second
  ) {
    return new Date(t);
  }
  return null;
}
