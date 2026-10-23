import type { CronFieldName } from '../types';

/**
 * @description 内置语言代码
 */
export type CronLocaleCode = 'zh-CN' | 'en-US';

/**
 * @description 自然语言 / Tab / 周标签文案包
 */
export interface CronLocaleMessages {
  /** @description 语言代码 */
  code: CronLocaleCode | string;
  /** @description Tab 标签 */
  tabs: Record<CronFieldName, string>;
  /** @description describeField 用的字段单位名 */
  fieldUnits: Record<CronFieldName, string>;
  /** @description 每周摘要默认「每天 / Every day」 */
  everyDay: string;
  /** @description 无法概括时的回退 */
  customSchedule: string;
  /** @description 「在 {value} {unit}」 */
  atUnit: (value: string, unit: string) => string;
  /** @description 「每{weekday}」如 每周一 / every Monday */
  everyWeekday: (weekday: string) => string;
  /** @description 周区间「周一至周五」 */
  weekRange: (from: string, to: string) => string;
  /** @description 普通区间「小时 1-5」 */
  range: (unit: string, from: string, to: string) => string;
  /** @description 「每 N 单位（从 x）」 */
  step: (step: string, unit: string, from: string) => string;
  /** @description list 非周：「小时为 1、2」 */
  list: (unit: string, items: string) => string;
  /** @description list 周：顿号/逗号连接 */
  listJoin: (items: string[]) => string;
  /** @description 最后一天 */
  lastDay: string;
  /** @description 最后一个星期 x */
  lastWeekdayOfMonth: (weekdayShort: string) => string;
  /** @description 本月最后一个工作日 */
  lastWorkday: string;
  /** @description 最接近 n 号的工作日 */
  nearestWorkday: (day: string) => string;
  /** @description 第 n 个星期 x */
  nthWeekday: (n: string, weekdayShort: string) => string;
  /** @description 年 specific：「2026 年」 */
  yearSpecific: (year: string) => string;
  /** @description 时/分/秒 specific 片段 */
  hourSpecific: (h: string) => string;
  minuteSpecific: (m: string) => string;
  secondSpecific: (s: string) => string;
  /** @description Quartz 0-7 → 自然语言周标签（周一 / Monday） */
  weekDayFull: Record<number, string>;
  /** @description Quartz 0-7 → 短标签（一 / Mon） */
  weekDayShort: Record<number, string>;
}
