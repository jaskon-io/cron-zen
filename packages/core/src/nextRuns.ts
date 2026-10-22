import type { CronFieldState, CronState } from './types';

/**
 * @description 将字段状态展开为候选数值集合（覆盖 every / specific / list / range / step）
 * @param {CronFieldState} field - 字段状态
 * @param {number} min - 最小值
 * @param {number} max - 最大值
 * @returns {number[] | null} 候选列表；无法展开时返回 null
 * @example
 * expandFieldValues({ mode: 'specific', raw: '2', value: '2' }, 0, 23); // [2]
 */
export function expandFieldValues(
  field: CronFieldState,
  min: number,
  max: number,
): number[] | null {
  switch (field.mode) {
    case 'every':
    case 'unset':
      return Array.from({ length: max - min + 1 }, (_, i) => min + i);
    case 'specific': {
      const n = Number(field.value);
      return Number.isFinite(n) ? [n] : null;
    }
    case 'list': {
      const values = (field.values ?? field.value?.split(',') ?? [])
        .map((v) => Number(v))
        .filter((n) => Number.isFinite(n));
      return values.length > 0 ? values : null;
    }
    case 'range': {
      const start = Number(field.value);
      const end = Number(field.secondary);
      if (!Number.isFinite(start) || !Number.isFinite(end) || start > end) return null;
      return Array.from({ length: end - start + 1 }, (_, i) => start + i);
    }
    case 'step': {
      const step = Number(field.secondary);
      if (!Number.isFinite(step) || step < 1) return null;
      const base = field.value && field.value !== '*' ? Number(field.value) : min;
      if (!Number.isFinite(base)) return null;
      const out: number[] = [];
      for (let v = base; v <= max; v += step) out.push(v);
      return out;
    }
    default:
      return null;
  }
}

/**
 * @description 估算最近 N 次触发时间（从 from 起按日推进，早停；L/W/nth 无法展开时返回空）
 * @param {CronState} state - 可视化状态
 * @param {number} [count=10] - 返回条数
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

  const yearCandidates =
    state.year.mode === 'every' || state.year.mode === 'unset'
      ? null
      : expandFieldValues(state.year, 1970, 2099);

  const fromTs = from.getTime();
  const results: Date[] = [];
  const sortedSeconds = [...seconds].sort((a, b) => a - b);
  const sortedMinutes = [...minutes].sort((a, b) => a - b);
  const sortedHours = [...hours].sort((a, b) => a - b);

  const cursor = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const maxDays = 366 * 5;

  for (let i = 0; i < maxDays && results.length < count; i++) {
    const year = cursor.getFullYear();
    const month = cursor.getMonth() + 1;
    const day = cursor.getDate();

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
      for (const minute of sortedMinutes) {
        for (const second of sortedSeconds) {
          const dt = new Date(year, month - 1, day, hour, minute, second, 0);
          if (dt.getTime() <= fromTs) continue;
          results.push(dt);
          if (results.length >= count) return results;
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
 * @returns {string} `YYYY-MM-DD HH:mm:ss`
 * @example
 * formatRunTime(new Date('2026-01-01T08:00:00')); // '2026-01-01 08:00:00'
 */
export function formatRunTime(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}
