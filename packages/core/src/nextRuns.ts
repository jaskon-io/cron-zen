import type { CronFieldState, CronState } from './types';
import {
  getZonedParts,
  isValidTimeZone,
  zonedWallTimeToUtc,
} from './timezone';
import { matchesQuartzWeek } from './week';

/**
 * @description getNextRuns / formatRunTime 时区选项
 */
export interface TimeZoneOptions {
  /**
   * @description IANA 时区（如 Asia/Shanghai）；省略则用运行环境本地时区
   */
  timeZone?: string;
}

/** 单次预估最多返回条数，防止异常入参拖垮 UI */
const MAX_NEXT_RUN_COUNT = 100;

/** 单字段展开最大跨度，防止恶意 min/max 占满内存 */
const MAX_EXPAND_SPAN = 400;

/** 日推进扫描上限（约 5 年） */
const MAX_SCAN_DAYS = 366 * 5;

/**
 * @description 将数值夹紧到闭区间
 * @param {number} n - 原始值
 * @param {number} min - 下界
 * @param {number} max - 上界
 * @returns {number} 夹紧结果
 */
function clampInt(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

/**
 * @description 安全生成连续整数数组（超跨度返回 null）
 * @param {number} start - 起
 * @param {number} end - 止
 * @returns {number[] | null} 列表或 null
 */
function rangeArray(start: number, end: number): number[] | null {
  if (!Number.isFinite(start) || !Number.isFinite(end) || start > end) return null;
  const span = end - start + 1;
  if (span > MAX_EXPAND_SPAN) return null;
  const out = new Array<number>(span);
  for (let i = 0; i < span; i++) out[i] = start + i;
  return out;
}

/**
 * @description 展开区间；起点大于终点时按环形字段回绕（对齐 cron.ren，如周 7-3、时 22-2）
 * @param {number} start - 起（已夹紧）
 * @param {number} end - 止（已夹紧）
 * @param {number} min - 字段下界
 * @param {number} max - 字段上界
 * @returns {number[] | null} 候选列表
 * @example
 * rangeArrayMaybeWrap(7, 3, 1, 7); // [7, 1, 2, 3]
 * rangeArrayMaybeWrap(22, 2, 0, 23); // [22, 23, 0, 1, 2]
 */
function rangeArrayMaybeWrap(
  start: number,
  end: number,
  min: number,
  max: number,
): number[] | null {
  if (start <= end) return rangeArray(start, end);
  const high = rangeArray(start, max);
  const low = rangeArray(min, end);
  if (!high || !low) return null;
  if (high.length + low.length > MAX_EXPAND_SPAN) return null;
  return [...high, ...low];
}

/**
 * @description 将字段状态展开为候选数值集合（覆盖 every / specific / list / range / step）
 * @param {CronFieldState} field - 字段状态
 * @param {number} min - 最小值
 * @param {number} max - 最大值
 * @returns {number[] | null} 候选列表；无法展开或越界无有效值时返回 null
 * @example
 * expandFieldValues({ mode: 'specific', raw: '2', value: '2' }, 0, 23); // [2]
 */
export function expandFieldValues(
  field: CronFieldState,
  min: number,
  max: number,
): number[] | null {
  if (!Number.isFinite(min) || !Number.isFinite(max) || min > max) {
    return null;
  }
  if (max - min + 1 > MAX_EXPAND_SPAN) {
    return null;
  }

  switch (field.mode) {
    case 'every':
    case 'unset':
      return rangeArray(min, max);
    case 'specific': {
      const n = Number(field.value);
      if (!Number.isFinite(n)) return null;
      // 越界值若交给 Date 构造会进位（如 hour=99），必须拒绝
      if (n < min || n > max) return null;
      return [n];
    }
    case 'list': {
      const span = max - min + 1;
      const raw = (field.values ?? field.value?.split(',') ?? []).slice(0, span);
      const values = raw
        .map((v) => Number(v))
        .filter((n) => Number.isFinite(n) && n >= min && n <= max);
      return values.length > 0 ? [...new Set(values)].sort((a, b) => a - b) : null;
    }
    case 'range': {
      const rawStart = Number(field.value);
      const rawEnd = Number(field.secondary);
      if (!Number.isFinite(rawStart) || !Number.isFinite(rawEnd)) {
        return null;
      }
      // 夹紧到合法区间，避免 0..999999 这类恶意/异常输入占满内存
      const start = clampInt(rawStart, min, max);
      const end = clampInt(rawEnd, min, max);
      // 倒序（如周 7-3）：按 [min,max] 环形回绕展开，供近 N 次预估
      return rangeArrayMaybeWrap(start, end, min, max);
    }
    case 'step': {
      const step = Number(field.secondary);
      if (!Number.isFinite(step) || step < 1) return null;
      const span = max - min + 1;
      const safeStep = Math.max(1, Math.min(Math.floor(step), span));
      const rawBase = field.value && field.value.length > 0 ? field.value : '*';

      // 区间步长 a-b/n（Quartz / cron.ren）；支持 a>b 回绕
      if (rawBase.includes('-')) {
        const [a, b] = rawBase.split('-');
        const startRaw = Number(a);
        const endRaw = Number(b);
        if (!Number.isFinite(startRaw) || !Number.isFinite(endRaw)) {
          return null;
        }
        const start = clampInt(startRaw, min, max);
        const end = clampInt(endRaw, min, max);
        const domain = rangeArrayMaybeWrap(start, end, min, max);
        if (!domain) return null;
        const out: number[] = [];
        for (let i = 0; i < domain.length; i += safeStep) {
          out.push(domain[i]!);
          if (out.length > MAX_EXPAND_SPAN) break;
        }
        return out;
      }

      const baseRaw = rawBase !== '*' ? Number(rawBase) : min;
      if (!Number.isFinite(baseRaw)) return null;
      const base = clampInt(baseRaw, min, max);
      const out: number[] = [];
      for (let v = base; v <= max; v += safeStep) {
        out.push(v);
        if (out.length > MAX_EXPAND_SPAN) break;
      }
      return out;
    }
    default:
      // last / weekday / nth 等无法安全展开为有限集合
      return null;
  }
}

/**
 * @description 规范化预估条数
 * @param {number} count - 原始条数
 * @returns {number} 夹紧后的条数；非法时返回 0
 */
function normalizeCount(count: number): number {
  if (!Number.isFinite(count)) return 0;
  const n = Math.floor(count);
  if (n < 1) return 0;
  return Math.min(n, MAX_NEXT_RUN_COUNT);
}

/**
 * @description 某月最后一天（公历）
 * @param {number} year - 年
 * @param {number} month - 月（1-12）
 * @returns {number} 28-31
 * @example
 * lastDayOfMonth(2026, 2); // 28
 */
export function lastDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/**
 * @description 某月最后一个工作日（Quartz LW：若月末为周六/日则回退到周五）
 * @param {number} year - 年
 * @param {number} month - 月（1-12）
 * @returns {number} 日号
 * @example
 * lastWeekdayOfMonth(2026, 1); // 2026-01-31 周六 → 30（周五）
 */
export function lastWeekdayOfMonth(year: number, month: number): number {
  let day = lastDayOfMonth(year, month);
  const jsDay = new Date(year, month - 1, day).getDay();
  if (jsDay === 6) day -= 1;
  else if (jsDay === 0) day -= 2;
  return day;
}

/**
 * @description 某月最接近指定日号的工作日（Quartz nW；不跨月）
 * @param {number} year - 年
 * @param {number} month - 月（1-12）
 * @param {number} dayOfMonth - 目标日号（1-31）
 * @returns {number | null} 实际触发日；日号越界或不存在返回 null
 * @example
 * // 2026-01-31 周六 → 30；2026-02-01 周日 → 2
 * nearestWeekdayOfMonth(2026, 1, 31); // 30
 * nearestWeekdayOfMonth(2026, 2, 1); // 2
 */
export function nearestWeekdayOfMonth(
  year: number,
  month: number,
  dayOfMonth: number,
): number | null {
  if (!Number.isFinite(dayOfMonth)) return null;
  const dom = Math.floor(dayOfMonth);
  const last = lastDayOfMonth(year, month);
  if (dom < 1 || dom > last) return null;

  const jsDay = new Date(year, month - 1, dom).getDay();
  if (jsDay >= 1 && jsDay <= 5) return dom;

  if (jsDay === 6) {
    // 周六：优先前一日周五；若为 1 号则进到周一（不跨月）
    return dom > 1 ? dom - 1 : dom + 2;
  }
  // 周日：优先后一日周一；若为月末则退到周五
  return dom < last ? dom + 1 : dom - 2;
}

/**
 * @description Quartz 周数字 → JS Date.getDay()（0=周日…6=周六）
 * @param {number} quartzWeekDay - 0/1=周日，2=周一…7=周六
 * @returns {number | null} JS 星期；非法返回 null
 */
function quartzWeekToJsDay(quartzWeekDay: number): number | null {
  if (!Number.isFinite(quartzWeekDay)) return null;
  const q = Math.floor(quartzWeekDay);
  if (q === 0 || q === 1) return 0;
  if (q >= 2 && q <= 7) return q - 1;
  return null;
}

/**
 * @description 某月最后一个指定 Quartz 星期（nL，如 6L=最后一个周五）
 * @param {number} year - 年
 * @param {number} month - 月（1-12）
 * @param {number} quartzWeekDay - Quartz 周数字（0/1=日…7=六）
 * @returns {number | null} 日号；非法星期返回 null
 * @example
 * lastQuartzWeekdayOfMonth(2026, 1, 6); // 30（最后一个周五）
 */
export function lastQuartzWeekdayOfMonth(
  year: number,
  month: number,
  quartzWeekDay: number,
): number | null {
  const jsTarget = quartzWeekToJsDay(quartzWeekDay);
  if (jsTarget == null) return null;
  let day = lastDayOfMonth(year, month);
  while (day >= 1) {
    if (new Date(year, month - 1, day).getDay() === jsTarget) return day;
    day -= 1;
  }
  return null;
}

/**
 * @description 某月第 n 个指定 Quartz 星期（n#m，如 6#3=第三个周五）
 * @param {number} year - 年
 * @param {number} month - 月（1-12）
 * @param {number} quartzWeekDay - Quartz 周数字
 * @param {number} nth - 第几个（1-5）
 * @returns {number | null} 日号；该月不存在第 n 个时返回 null
 * @example
 * nthQuartzWeekdayOfMonth(2026, 1, 6, 3); // 16
 */
export function nthQuartzWeekdayOfMonth(
  year: number,
  month: number,
  quartzWeekDay: number,
  nth: number,
): number | null {
  if (!Number.isFinite(nth)) return null;
  const n = Math.floor(nth);
  if (n < 1 || n > 5) return null;
  const jsTarget = quartzWeekToJsDay(quartzWeekDay);
  if (jsTarget == null) return null;

  const last = lastDayOfMonth(year, month);
  let day = 1;
  while (day <= last && new Date(year, month - 1, day).getDay() !== jsTarget) {
    day += 1;
  }
  if (day > last) return null;
  const result = day + (n - 1) * 7;
  return result <= last ? result : null;
}

/**
 * @description 全量时分秒（每秒触发）时的快速路径：按秒递增，避免 86400 次嵌套 Date
 * @param {number} limit - 条数
 * @param {number} fromTs - 起始时间戳
 * @returns {Date[]} 触发列表
 */
function nextRunsEverySecond(limit: number, fromTs: number): Date[] {
  const results: Date[] = new Array(limit);
  let t = fromTs + 1000;
  for (let i = 0; i < limit; i++) {
    results[i] = new Date(t);
    t += 1000;
  }
  return results;
}

/**
 * @description 估算最近 N 次触发时间（从 from 起按日推进，早停）
 * 支持日 `L` / `LW` / `nW`，周 `nL` / `n#m`；周裸 `L` 按 Quartz 视为每周六。
 * 传入 `timeZone` 时按该 IANA 时区的墙上时钟解释 Cron 字段。
 * @param {CronState} state - 可视化状态
 * @param {number} [count=10] - 返回条数（1-100）
 * @param {Date} [from] - 起始时间（默认当前）
 * @param {TimeZoneOptions} [options] - 时区选项
 * @returns {Date[]} 触发时间列表（UTC 时间戳）
 * @example
 * getNextRuns(createDefaultCronState(), 3);
 * getNextRuns(state, 5, new Date(), { timeZone: 'Asia/Shanghai' });
 */
export function getNextRuns(
  state: CronState,
  count = 10,
  from: Date = new Date(),
  options?: TimeZoneOptions,
): Date[] {
  const limit = normalizeCount(count);
  if (limit === 0) return [];
  if (!(from instanceof Date) || Number.isNaN(from.getTime())) return [];

  const tz =
    options?.timeZone && isValidTimeZone(options.timeZone)
      ? options.timeZone.trim()
      : undefined;

  // 时间字段按数值升序迭代，保证倒序回绕（如时 22-2 → [22,23,0,1,2]）在日内按时钟推进
  const seconds = expandFieldValues(state.second, 0, 59)?.slice().sort((a, b) => a - b) ?? null;
  const minutes = expandFieldValues(state.minute, 0, 59)?.slice().sort((a, b) => a - b) ?? null;
  const hours = expandFieldValues(state.hour, 0, 23)?.slice().sort((a, b) => a - b) ?? null;
  const months = expandFieldValues(state.month, 1, 12);

  /** 日字段裸 L（最后一天） */
  const dayIsLast = state.day.mode === 'last' && !state.day.value;
  /** 日字段 LW（最后工作日） */
  const dayIsLW = state.day.mode === 'lastWeekday';
  /** 日字段 nW（最接近 n 号的工作日） */
  const weekdayNear =
    state.day.mode === 'weekday' ? Number(state.day.value) : Number.NaN;
  const dayIsWeekday =
    state.day.mode === 'weekday' &&
    Number.isFinite(weekdayNear) &&
    weekdayNear >= 1 &&
    weekdayNear <= 31;
  const daySpecial = dayIsLast || dayIsLW || dayIsWeekday;
  const daysExpanded = daySpecial ? null : expandFieldValues(state.day, 1, 31);

  if (!seconds || !minutes || !hours || !months) {
    return [];
  }
  if (state.day.mode === 'weekday' && !dayIsWeekday) {
    return [];
  }
  if (!daySpecial && daysExpanded == null) {
    return [];
  }
  const days = daysExpanded ?? [];

  const weekConcrete = state.week.mode !== 'every' && state.week.mode !== 'unset';
  const dayConcrete = state.day.mode !== 'every' && state.day.mode !== 'unset';

  /** 周 nL：本月最后一个星期 x */
  const weekLastQ =
    state.week.mode === 'last' && state.week.value != null && state.week.value !== ''
      ? Number(state.week.value)
      : Number.NaN;
  const weekIsLast =
    state.week.mode === 'last' &&
    Number.isFinite(weekLastQ) &&
    weekLastQ >= 0 &&
    weekLastQ <= 7;
  /** 周裸 L：Quartz 视为每周六（7） */
  const weekIsBareL = state.week.mode === 'last' && !weekIsLast;
  /** 周 n#m：第 m 个星期 n */
  const weekNthQ = state.week.mode === 'nth' ? Number(state.week.value) : Number.NaN;
  const weekNthN = state.week.mode === 'nth' ? Number(state.week.secondary) : Number.NaN;
  const weekIsNth =
    state.week.mode === 'nth' &&
    Number.isFinite(weekNthQ) &&
    weekNthQ >= 0 &&
    weekNthQ <= 7 &&
    Number.isFinite(weekNthN) &&
    weekNthN >= 1 &&
    weekNthN <= 5;

  let weeks: number[] | null = null;
  if (weekConcrete) {
    if (weekIsLast || weekIsNth) {
      weeks = null;
    } else if (weekIsBareL) {
      // Quartz：日-of-week 单独 L ≡ SAT
      weeks = [7];
    } else {
      weeks = expandFieldValues(state.week, 0, 7);
      if (weeks == null) return [];
    }
    if (state.week.mode === 'last' && !weekIsLast && !weekIsBareL) return [];
    if (state.week.mode === 'nth' && !weekIsNth) return [];
  }

  const yearCandidates =
    state.year.mode === 'every' || state.year.mode === 'unset'
      ? null
      : expandFieldValues(state.year, 1970, 2099);

  // 年字段具体但无法展开
  if (
    state.year.mode !== 'every' &&
    state.year.mode !== 'unset' &&
    yearCandidates == null
  ) {
    return [];
  }

  const fromTs = from.getTime();

  // 默认 cron.ren 态 `* * * * * ? *`：每秒触发，走 O(N) 快路径
  const denseCalendar =
    !weekConcrete &&
    !dayConcrete &&
    yearCandidates == null &&
    months.length === 12 &&
    !daySpecial &&
    days.length === 31;
  const denseTime = hours.length === 24 && minutes.length === 60 && seconds.length === 60;
  // 每秒快路径仅本地时区（与历史行为一致）；显式 timeZone 走通用扫描
  if (denseCalendar && denseTime && !tz) {
    return nextRunsEverySecond(limit, fromTs);
  }

  const monthSet = new Set(months);
  const daySet = dayConcrete && !daySpecial ? new Set(days) : null;
  const yearSet = yearCandidates ? new Set(yearCandidates) : null;
  const sortedYears = yearCandidates ? [...yearCandidates].sort((a, b) => a - b) : null;

  const results: Date[] = [];

  // 日历光标：本地用 Date；时区用墙上 Y-M-D 三元组推进
  let cursorY: number;
  let cursorM: number;
  let cursorD: number;
  let fromY: number;
  let fromMo: number;
  let fromD: number;
  let fromH: number;
  let fromMi: number;

  if (tz) {
    const zp = getZonedParts(from, tz);
    if (!zp) return [];
    cursorY = zp.year;
    cursorM = zp.month;
    cursorD = zp.day;
    fromY = zp.year;
    fromMo = zp.month;
    fromD = zp.day;
    fromH = zp.hour;
    fromMi = zp.minute;
  } else {
    cursorY = from.getFullYear();
    cursorM = from.getMonth() + 1;
    cursorD = from.getDate();
    fromY = cursorY;
    fromMo = cursorM;
    fromD = cursorD;
    fromH = from.getHours();
    fromMi = from.getMinutes();
  }

  const advanceDay = (): void => {
    if (tz) {
      // 用 UTC 中午锚点 +1 天再读回时区日期，避开 DST 歧义
      const noon = zonedWallTimeToUtc(cursorY, cursorM, cursorD, 12, 0, 0, tz);
      if (!noon) {
        // 退化：按公历 +1
        const tmp = new Date(Date.UTC(cursorY, cursorM - 1, cursorD + 1, 12));
        cursorY = tmp.getUTCFullYear();
        cursorM = tmp.getUTCMonth() + 1;
        cursorD = tmp.getUTCDate();
        return;
      }
      const next = getZonedParts(new Date(noon.getTime() + 24 * 3600 * 1000), tz);
      if (!next) return;
      cursorY = next.year;
      cursorM = next.month;
      cursorD = next.day;
    } else {
      const cursor = new Date(cursorY, cursorM - 1, cursorD);
      cursor.setDate(cursor.getDate() + 1);
      cursorY = cursor.getFullYear();
      cursorM = cursor.getMonth() + 1;
      cursorD = cursor.getDate();
    }
  };

  const setCursor = (y: number, m: number, d: number): void => {
    cursorY = y;
    cursorM = m;
    cursorD = d;
  };

  const jsWeekday = (): number => {
    if (tz) {
      const noon = zonedWallTimeToUtc(cursorY, cursorM, cursorD, 12, 0, 0, tz);
      if (!noon) return 0;
      return getZonedParts(noon, tz)?.weekday ?? 0;
    }
    return new Date(cursorY, cursorM - 1, cursorD).getDay();
  };

  for (let i = 0; i < MAX_SCAN_DAYS && results.length < limit; i++) {
    const year = cursorY;
    const month = cursorM;
    const day = cursorD;
    const sameDayAsFrom = year === fromY && month === fromMo && day === fromD;

    if (yearSet && !yearSet.has(year)) {
      const nextY = sortedYears!.find((y) => y > year);
      if (nextY == null) break;
      setCursor(nextY, 1, 1);
      continue;
    }
    if (!monthSet.has(month)) {
      let jumped = false;
      for (const m of months) {
        if (m > month) {
          setCursor(year, m, 1);
          jumped = true;
          break;
        }
      }
      if (!jumped) {
        setCursor(year + 1, months[0] ?? 1, 1);
      }
      continue;
    }
    if (dayIsLast) {
      if (day !== lastDayOfMonth(year, month)) {
        advanceDay();
        continue;
      }
    } else if (dayIsLW) {
      if (day !== lastWeekdayOfMonth(year, month)) {
        advanceDay();
        continue;
      }
    } else if (dayIsWeekday) {
      const target = nearestWeekdayOfMonth(year, month, weekdayNear);
      if (target == null || day !== target) {
        advanceDay();
        continue;
      }
    } else if (daySet && !daySet.has(day)) {
      advanceDay();
      continue;
    }
    if (weekIsLast) {
      const target = lastQuartzWeekdayOfMonth(year, month, weekLastQ);
      if (target == null || day !== target) {
        advanceDay();
        continue;
      }
    } else if (weekIsNth) {
      const target = nthQuartzWeekdayOfMonth(year, month, weekNthQ, weekNthN);
      if (target == null || day !== target) {
        advanceDay();
        continue;
      }
    } else if (weekConcrete && weeks) {
      if (!matchesQuartzWeek(jsWeekday(), weeks)) {
        advanceDay();
        continue;
      }
    }

    for (const hour of hours) {
      if (sameDayAsFrom && hour < fromH) continue;
      for (const minute of minutes) {
        if (sameDayAsFrom && hour === fromH && minute < fromMi) {
          continue;
        }
        for (const second of seconds) {
          const dt = tz
            ? zonedWallTimeToUtc(year, month, day, hour, minute, second, tz)
            : new Date(year, month - 1, day, hour, minute, second, 0);
          if (!dt || Number.isNaN(dt.getTime())) continue;
          if (dt.getTime() <= fromTs) continue;
          results.push(dt);
          if (results.length >= limit) return results;
        }
      }
    }

    advanceDay();
  }

  return results;
}

/**
 * @description 格式化触发时间为可读字符串（默认本地；可指定 IANA 时区）
 * @param {Date} date - 时间
 * @param {TimeZoneOptions} [options] - 时区选项
 * @returns {string} `YYYY-MM-DD HH:mm:ss`；非法 Date 返回空串
 * @example
 * formatRunTime(new Date('2026-01-01T08:00:00')); // 本地
 * formatRunTime(date, { timeZone: 'UTC' }); // '…' 按 UTC
 */
export function formatRunTime(date: Date, options?: TimeZoneOptions): string {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  const tz =
    options?.timeZone && isValidTimeZone(options.timeZone)
      ? options.timeZone.trim()
      : undefined;
  if (tz) {
    const p = getZonedParts(date, tz);
    if (!p) return '';
    return `${p.year}-${pad(p.month)}-${pad(p.day)} ${pad(p.hour)}:${pad(p.minute)}:${pad(p.second)}`;
  }
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}
