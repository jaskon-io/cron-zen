import type { CronLocaleInput, CronPresetId } from './i18n';
import { resolveLocale } from './i18n';

export type { CronPresetId } from './i18n';

/**
 * @description 预设定义（表达式固定；文案走 locale）
 */
export interface CronPresetDef {
  /** @description 稳定 id */
  id: CronPresetId;
  /** @description Quartz 6 段表达式（秒 分 时 日 月 周） */
  expression: string;
}

/**
 * @description 带当前语言标签的预设
 */
export interface CronPreset extends CronPresetDef {
  /** @description 展示名 */
  label: string;
}

/** @description 内置常用模板（对齐 cron.ren / Quartz 常见场景） */
const PRESET_DEFS: readonly CronPresetDef[] = [
  { id: 'every-minute', expression: '0 * * * * ?' },
  { id: 'every-5-minutes', expression: '0 */5 * * * ?' },
  { id: 'every-30-minutes', expression: '0 */30 * * * ?' },
  { id: 'every-hour', expression: '0 0 * * * ?' },
  { id: 'every-day-midnight', expression: '0 0 0 * * ?' },
  { id: 'every-day-9am', expression: '0 0 9 * * ?' },
  { id: 'weekdays-9am', expression: '0 0 9 ? * 2-6' },
  { id: 'every-monday-9am', expression: '0 0 9 ? * 2' },
  { id: 'first-day-month', expression: '0 0 0 1 * ?' },
  { id: 'last-day-month', expression: '0 0 0 L * ?' },
];

/**
 * @description 列出内置预设定义（无文案）
 * @returns {readonly CronPresetDef[]}
 * @example
 * listCronPresetDefs()[0].expression; // '0 * * * * ?'
 */
export function listCronPresetDefs(): readonly CronPresetDef[] {
  return PRESET_DEFS;
}

/**
 * @description 按 locale 返回带标签的预设列表
 * @param {CronLocaleInput} [locale] - 语言（默认 zh-CN）
 * @returns {CronPreset[]}
 * @example
 * getCronPresets('en-US')[0].label; // 'Every minute'
 */
export function getCronPresets(locale?: CronLocaleInput): CronPreset[] {
  const labels = resolveLocale(locale).presets;
  return PRESET_DEFS.map((d) => ({
    ...d,
    label: labels[d.id] ?? d.id,
  }));
}

/**
 * @description 按 id 取预设（含标签）
 * @param {CronPresetId | string} id - 预设 id
 * @param {CronLocaleInput} [locale] - 语言
 * @returns {CronPreset | undefined}
 */
export function getCronPreset(
  id: CronPresetId | string,
  locale?: CronLocaleInput,
): CronPreset | undefined {
  return getCronPresets(locale).find((p) => p.id === id);
}
