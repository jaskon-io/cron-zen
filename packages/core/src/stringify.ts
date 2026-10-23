import type { CronFieldName, CronFieldState, WeekFormat } from './types';
import { weekNumberToAbbr } from './week';

/**
 * @description stringifyField 选项
 */
export interface StringifyFieldOptions {
  /**
   * @description 周字段输出写法（仅 fieldName=week 时生效）
   */
  weekFormat?: WeekFormat;
  /**
   * @description 当前字段名（用于年 unset→*、周 abbr）
   */
  fieldName?: CronFieldName;
}

/**
 * @description 将数值/数字串按周写法格式化
 * @param {string} value - 原始值
 * @param {WeekFormat | undefined} weekFormat - 写法
 * @param {boolean} apply - 是否应用 abbr
 * @returns {string} 格式化结果
 */
function formatWeekPart(value: string, weekFormat: WeekFormat | undefined, apply: boolean): string {
  if (!apply || weekFormat !== 'abbr') return value;
  if (!/^\d+$/.test(value)) return value;
  return weekNumberToAbbr(Number(value));
}

/**
 * @description 将单个字段状态序列化为 Cron 字段字符串
 * @param {CronFieldState} field - 字段可视化状态
 * @param {StringifyFieldOptions} [options] - 序列化选项
 * @returns {string} 字段原始串（如 `0/5`、`1-3`、`?`、`MON`）
 * @example
 * stringifyField({ mode: 'step', raw: '0/5', value: '0', secondary: '5' }); // '0/5'
 * stringifyField({ mode: 'specific', raw: '2', value: '2' }, { fieldName: 'week', weekFormat: 'abbr' }); // 'MON'
 */
export function stringifyField(
  field: CronFieldState,
  options: StringifyFieldOptions = {},
): string {
  const { weekFormat = 'number', fieldName } = options;

  // 年「不指定」不输出占位（由 generateCron 省略第 7 段）；此处若被单独调用则返回空串
  if (fieldName === 'year' && field.mode === 'unset') {
    return '';
  }

  const weekAbbr = fieldName === 'week' && weekFormat === 'abbr';

  switch (field.mode) {
    case 'every':
      return '*';
    case 'unset':
      return '?';
    case 'specific': {
      const v = field.value || field.raw || '0';
      return formatWeekPart(v, weekFormat, weekAbbr);
    }
    case 'range': {
      const start = formatWeekPart(field.value || '0', weekFormat, weekAbbr);
      const end = formatWeekPart(field.secondary || field.value || '0', weekFormat, weekAbbr);
      return `${start}-${end}`;
    }
    case 'step': {
      const baseRaw = field.value && field.value.length > 0 ? field.value : '*';
      const base =
        baseRaw === '*'
          ? '*'
          : baseRaw.includes('-')
            ? baseRaw
                .split('-')
                .map((p) => formatWeekPart(p, weekFormat, weekAbbr))
                .join('-')
            : formatWeekPart(baseRaw, weekFormat, weekAbbr);
      const step = field.secondary || '1';
      return `${base}/${step}`;
    }
    case 'list': {
      const values = field.values?.length
        ? field.values
        : (field.value || field.raw || '*').split(',').filter(Boolean);
      if (values.length === 0) return '*';
      return values.map((v) => formatWeekPart(v, weekFormat, weekAbbr)).join(',');
    }
    case 'last':
      if (!field.value) return 'L';
      return `${formatWeekPart(field.value, weekFormat, weekAbbr)}L`;
    case 'lastWeekday':
      return 'LW';
    case 'weekday':
      return `${field.value ?? '1'}W`;
    case 'nth': {
      const w = formatWeekPart(field.value ?? '1', weekFormat, weekAbbr);
      return `${w}#${field.secondary ?? '1'}`;
    }
    default:
      return field.raw || '*';
  }
}
