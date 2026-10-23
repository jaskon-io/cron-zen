import type { CronFieldName } from './types';
import { FIELD_RANGES } from './types';
import { resolveLocale, type CronLocaleInput } from './i18n';

/**
 * @description Tab 元数据（供适配层渲染）
 */
export interface CronTabMeta {
  /** @description 字段名 */
  name: CronFieldName;
  /** @description 显示标签 */
  label: string;
  /** @description 合法最小值 */
  min: number;
  /** @description 合法最大值 */
  max: number;
}

const TAB_ORDER: CronFieldName[] = [
  'second',
  'minute',
  'hour',
  'day',
  'month',
  'week',
  'year',
];

/**
 * @description 获取七段 Tab 元数据列表
 * @param {CronLocaleInput} [locale] - 语言（默认 zh-CN）
 * @returns {CronTabMeta[]} Tab 列表
 * @example
 * getCronTabs();
 * getCronTabs('en-US');
 */
export function getCronTabs(locale?: CronLocaleInput): CronTabMeta[] {
  const messages = resolveLocale(locale);
  return TAB_ORDER.map((name) => ({
    name,
    label: messages.tabs[name],
    min: FIELD_RANGES[name].min,
    max: FIELD_RANGES[name].max,
  }));
}
