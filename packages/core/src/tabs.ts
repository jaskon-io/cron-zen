import type { CronFieldName } from './types';
import { FIELD_RANGES } from './types';

/**
 * @description Tab 元数据（供 Vue 适配层渲染）
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

const TAB_LABELS: Record<CronFieldName, string> = {
  second: '秒',
  minute: '分',
  hour: '时',
  day: '日',
  month: '月',
  week: '周',
  year: '年',
};

/**
 * @description 获取七段 Tab 元数据列表
 * @returns {CronTabMeta[]} Tab 列表
 * @example
 * const tabs = getCronTabs();
 */
export function getCronTabs(): CronTabMeta[] {
  return TAB_ORDER.map((name) => ({
    name,
    label: TAB_LABELS[name],
    min: FIELD_RANGES[name].min,
    max: FIELD_RANGES[name].max,
  }));
}
