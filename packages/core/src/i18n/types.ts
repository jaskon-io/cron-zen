import type { CronFieldName } from '../types';

/**
 * @description 内置语言代码
 */
export type CronLocaleCode = 'zh-CN' | 'en-US';

/**
 * @description 内置预设 id（与 presets.ts 对齐）
 */
export type CronPresetId =
  | 'every-minute'
  | 'every-5-minutes'
  | 'every-30-minutes'
  | 'every-hour'
  | 'every-day-midnight'
  | 'every-day-9am'
  | 'weekdays-9am'
  | 'every-monday-9am'
  | 'first-day-month'
  | 'last-day-month';

/**
 * @description FieldEditor / 预览壳 UI 文案（与 describe 分离，避免污染自然语言）
 */
export interface CronUiMessages {
  /** @description 「每秒」等行用的单位（秒 / second） */
  editorUnits: Record<CronFieldName, string>;
  /** @description 每{unit} / Every {unit} */
  every: (unit: string) => string;
  /** @description 不指定 */
  unset: string;
  /** @description 允许的通配符[, - * /] */
  wildcardsAllowed: (wildcards: string) => string;
  /** @description 年·不指定旁注「非必填」 */
  yearOptional: string;
  /** @description 周期 */
  range: string;
  /** @description 从 */
  from: string;
  /** @description 间隔 */
  step: string;
  /** @description 「秒开始, 每」 */
  stepStart: (unit: string) => string;
  /** @description 「秒执行一次」；日字段用 dayStepUnit */
  stepOnce: (unit: string) => string;
  /** @description 日间隔单位「天」 */
  dayStepUnit: string;
  /** @description 「每月」+ 数字 + nearestWorkdaySuffix */
  nearestWorkdayPrefix: string;
  /** @description 「号最近的那个工作日」 */
  nearestWorkdaySuffix: string;
  /** @description 每月最后一天 */
  lastDayOfMonth: string;
  /** @description 本月最后一个工作日 */
  lastWorkdayOfMonth: string;
  /** @description 「第」n「个」星期 */
  nthPrefix: string;
  /** @description 「个」 */
  nthMiddle: string;
  /** @description 「本月最后一个」+ 星期 */
  lastWeekdayPrefix: string;
  /** @description 指定 */
  specific: string;
  /** @description 周字段写法： */
  weekFormatLabel: string;
  /** @description 数字 1~7… */
  weekFormatNumber: string;
  /** @description 英文 SUN… */
  weekFormatAbbr: string;
  /** @description aria：周字段写法 */
  weekFormatAria: string;
  /** @description 周下拉 / 格子标签（星期天 / Sunday） */
  weekDayEditor: Record<number, string>;
  /** @description 月格子标签（1月 / Jan） */
  monthEditor: Record<number, string>;
  /** @description 日 Tab 被周占用时的提示 */
  mutexDayOccupied: string;
  /** @description 周 Tab 被日占用时的提示 */
  mutexWeekOccupied: string;
  /** @description 表达式 */
  expression: string;
  /** @description 复制 */
  copy: string;
  /** @description 已复制 */
  copied: string;
  /** @description 重置 */
  reset: string;
  /** @description 编辑{label} */
  editField: (label: string) => string;
  /** @description 近 N 次执行时间 */
  nextRunsTitle: (n: number) => string;
  /** @description 近 N 次已触发 */
  prevRunsTitle: (n: number) => string;
  /** @description 无法估算 */
  cannotEstimate: string;
  /** @description 空表达式占位 */
  expressionPlaceholder: string;
  /** @description 常用模板 */
  presetsLabel: string;
  /** @description 模板下拉占位 */
  presetsPlaceholder: string;
  /** @description aria：Cron 字段 */
  ariaTabs: string;
  /** @description aria：字段配置 */
  ariaBody: string;
  /** @description aria：预览 */
  ariaPreview: string;
}

/**
 * @description 自然语言 / Tab / 周标签 / UI 文案包
 */
export interface CronLocaleMessages {
  /** @description 语言代码 */
  code: CronLocaleCode | string;
  /** @description Tab 标签 */
  tabs: Record<CronFieldName, string>;
  /** @description describeField 用的字段单位名 */
  fieldUnits: Record<CronFieldName, string>;
  /** @description 编辑器与预览壳文案 */
  ui: CronUiMessages;
  /** @description 常用预设标签 */
  presets: Record<CronPresetId, string>;
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
