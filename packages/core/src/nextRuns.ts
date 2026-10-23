import type { CronFieldState, CronState } from './types';
import { matchesQuartzWeek } from './week';

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
 * 支持日字段 `L` / `LW`；周字段 `L`/`W`/`#` 等仍无法展开时返回空
 * @param {CronState} state - 可视化状态
 * @param {number} [count=10] - 返回条数（1-100）
 * @param {Date} [from] - 起始时间（默认当前）
 * @returns {Date[]} 触发时间列表
 * @example
 * getNextRuns(createDefaultCronState(), 3);
 */
export function getNextRuns(
  state: CronState,
  count = 10,
  from: Date = new Date(),
): Date[] {
  const limit = normalizeCount(count);
  if (limit === 0) return [];
  if (!(from instanceof Date) || Number.isNaN(from.getTime())) return [];

  // 时间字段按数值升序迭代，保证倒序回绕（如时 22-2 → [22,23,0,1,2]）在日内按时钟推进
  const seconds = expandFieldValues(state.second, 0, 59)?.slice().sort((a, b) => a - b) ?? null;
  const minutes = expandFieldValues(state.minute, 0, 59)?.slice().sort((a, b) => a - b) ?? null;
  const hours = expandFieldValues(state.hour, 0, 23)?.slice().sort((a, b) => a - b) ?? null;
  const months = expandFieldValues(state.month, 1, 12);

  /** 日字段裸 L（最后一天） */
  const dayIsLast = state.day.mode === 'last' && !state.day.value;
  /** 日字段 LW（最后工作日） */
  const dayIsLW = state.day.mode === 'lastWeekday';
  const daySpecial = dayIsLast || dayIsLW;
  const daysExpanded = daySpecial ? null : expandFieldValues(state.day, 1, 31);

  if (!seconds || !minutes || !hours || !months) {
    return [];
  }
  if (!daySpecial && daysExpanded == null) {
    return [];
  }
  const days = daysExpanded ?? [];

  const weekConcrete = state.week.mode !== 'every' && state.week.mode !== 'unset';
  const dayConcrete = state.day.mode !== 'every' && state.day.mode !== 'unset';
  const weeks = weekConcrete ? expandFieldValues(state.week, 0, 7) : null;

  // 周字段是具体模式但无法展开（L / W / # 等）→ 不可臆测，返回空
  if (weekConcrete && weeks == null) {
    return [];
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
  if (denseCalendar && denseTime) {
    return nextRunsEverySecond(limit, fromTs);
  }

  const monthSet = new Set(months);
  const daySet = dayConcrete && !daySpecial ? new Set(days) : null;
  const yearSet = yearCandidates ? new Set(yearCandidates) : null;
  const sortedYears = yearCandidates ? [...yearCandidates].sort((a, b) => a - b) : null;

  const results: Date[] = [];
  const cursor = new Date(from.getFullYear(), from.getMonth(), from.getDate());

  for (let i = 0; i < MAX_SCAN_DAYS && results.length < limit; i++) {
    const year = cursor.getFullYear();
    const month = cursor.getMonth() + 1;
    const day = cursor.getDate();
    const sameDayAsFrom =
      year === from.getFullYear() &&
      month === from.getMonth() + 1 &&
      day === from.getDate();

    if (yearSet && !yearSet.has(year)) {
      // 跳到下一个候选年，避免按日空转数年
      const nextY = sortedYears!.find((y) => y > year);
      if (nextY == null) break;
      cursor.setFullYear(nextY, 0, 1);
      continue;
    }
    if (!monthSet.has(month)) {
      // 跳到本月之后的下一个合法月，否则跨年
      let jumped = false;
      for (const m of months) {
        if (m > month) {
          cursor.setMonth(m - 1, 1);
          jumped = true;
          break;
        }
      }
      if (!jumped) {
        cursor.setFullYear(year + 1, (months[0] ?? 1) - 1, 1);
      }
      continue;
    }
    if (dayIsLast) {
      if (day !== lastDayOfMonth(year, month)) {
        cursor.setDate(cursor.getDate() + 1);
        continue;
      }
    } else if (dayIsLW) {
      if (day !== lastWeekdayOfMonth(year, month)) {
        cursor.setDate(cursor.getDate() + 1);
        continue;
      }
    } else if (daySet && !daySet.has(day)) {
      cursor.setDate(cursor.getDate() + 1);
      continue;
    }
    if (weekConcrete && weeks) {
      // Quartz：1=周日…7=周六（0=周日）；勿按 ISO/JS 直接比
      if (!matchesQuartzWeek(cursor.getDay(), weeks)) {
        cursor.setDate(cursor.getDate() + 1);
        continue;
      }
    }

    const fromH = from.getHours();
    const fromM = from.getMinutes();

    for (const hour of hours) {
      // 同一天时跳过已过去的小时，减少无意义 Date 构造
      if (sameDayAsFrom && hour < fromH) continue;
      for (const minute of minutes) {
        if (sameDayAsFrom && hour === fromH && minute < fromM) {
          continue;
        }
        for (const second of seconds) {
          const dt = new Date(year, month - 1, day, hour, minute, second, 0);
          // 统一用时间戳过滤已过去的秒（覆盖同分钟内的历史秒）
          if (dt.getTime() <= fromTs) continue;
          results.push(dt);
          if (results.length >= limit) return results;
        }
      }
    }

    cursor.setDate(cursor.getDate() + 1);
  }

  return results;
}

/**
 * @description 格式化触发时间为本地可读字符串
 * @param {Date} date - 时间
 * @returns {string} `YYYY-MM-DD HH:mm:ss`；非法 Date 返回空串
 * @example
 * formatRunTime(new Date('2026-01-01T08:00:00')); // '2026-01-01 08:00:00'
 */
export function formatRunTime(date: Date): string {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}
