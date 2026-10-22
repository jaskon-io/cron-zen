import type { CronFieldState, CronState } from './types';

/** 单次预估最多返回条数，防止异常入参拖垮 UI */
const MAX_NEXT_RUN_COUNT = 100;

/** 单字段展开上限（等于合法区间宽度即可） */
function clampInt(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
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

  switch (field.mode) {
    case 'every':
    case 'unset':
      return Array.from({ length: max - min + 1 }, (_, i) => min + i);
    case 'specific': {
      const n = Number(field.value);
      if (!Number.isFinite(n)) return null;
      // 越界值若交给 Date 构造会进位（如 hour=99），必须拒绝
      if (n < min || n > max) return null;
      return [n];
    }
    case 'list': {
      const values = (field.values ?? field.value?.split(',') ?? [])
        .map((v) => Number(v))
        .filter((n) => Number.isFinite(n) && n >= min && n <= max);
      return values.length > 0 ? [...new Set(values)].sort((a, b) => a - b) : null;
    }
    case 'range': {
      const rawStart = Number(field.value);
      const rawEnd = Number(field.secondary);
      if (!Number.isFinite(rawStart) || !Number.isFinite(rawEnd) || rawStart > rawEnd) {
        return null;
      }
      // 夹紧到合法区间，避免 0..999999 这类恶意/异常输入占满内存
      const start = clampInt(rawStart, min, max);
      const end = clampInt(rawEnd, min, max);
      return Array.from({ length: end - start + 1 }, (_, i) => start + i);
    }
    case 'step': {
      const step = Number(field.secondary);
      if (!Number.isFinite(step) || step < 1) return null;
      const baseRaw = field.value && field.value !== '*' ? Number(field.value) : min;
      if (!Number.isFinite(baseRaw)) return null;
      const base = clampInt(baseRaw, min, max);
      const safeStep = Math.min(step, max - min + 1);
      const out: number[] = [];
      for (let v = base; v <= max; v += safeStep) out.push(v);
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
 * @description 估算最近 N 次触发时间（从 from 起按日推进，早停；L/W/nth 无法展开时返回空）
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

  const seconds = expandFieldValues(state.second, 0, 59);
  const minutes = expandFieldValues(state.minute, 0, 59);
  const hours = expandFieldValues(state.hour, 0, 23);
  const days = expandFieldValues(state.day, 1, 31);
  const months = expandFieldValues(state.month, 1, 12);

  if (!seconds || !minutes || !hours || !days || !months) {
    return [];
  }

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
  const results: Date[] = [];
  const sortedSeconds = seconds;
  const sortedMinutes = minutes;
  const sortedHours = hours;

  const cursor = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const maxDays = 366 * 5;

  for (let i = 0; i < maxDays && results.length < limit; i++) {
    const year = cursor.getFullYear();
    const month = cursor.getMonth() + 1;
    const day = cursor.getDate();
    const sameDayAsFrom =
      year === from.getFullYear() &&
      month === from.getMonth() + 1 &&
      day === from.getDate();

    if (yearCandidates && !yearCandidates.includes(year)) {
      cursor.setDate(cursor.getDate() + 1);
      continue;
    }
    if (!months.includes(month)) {
      cursor.setDate(cursor.getDate() + 1);
      continue;
    }
    if (dayConcrete && !days.includes(day)) {
      cursor.setDate(cursor.getDate() + 1);
      continue;
    }
    if (weekConcrete && weeks) {
      const weekDay = cursor.getDay();
      const ok = weeks.includes(weekDay) || weeks.includes(weekDay === 0 ? 7 : weekDay);
      if (!ok) {
        cursor.setDate(cursor.getDate() + 1);
        continue;
      }
    }

    for (const hour of sortedHours) {
      // 同一天时跳过已过去的小时，减少无意义 Date 构造
      if (sameDayAsFrom && hour < from.getHours()) continue;
      for (const minute of sortedMinutes) {
        if (sameDayAsFrom && hour === from.getHours() && minute < from.getMinutes()) {
          continue;
        }
        for (const second of sortedSeconds) {
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
