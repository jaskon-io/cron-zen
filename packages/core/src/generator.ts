import {
  type CronFieldState,
  type CronState,
  type GenerateOptions,
  type GenerateResult,
  FIELD_ORDER,
  createDefaultCronState,
} from './types';
import { escapeCronPercent } from './parser';
import { enforceDayWeekMutex, validateCronState } from './validator';

/**
 * @description 将单个字段状态序列化为 Cron 字段字符串
 * @param {CronFieldState} field - 字段可视化状态
 * @returns {string} 字段原始串（如 `0/5`、`1-3`、`?`）
 * @example
 * stringifyField({ mode: 'step', raw: '0/5', value: '0', secondary: '5' }); // '0/5'
 */
export function stringifyField(field: CronFieldState): string {
  switch (field.mode) {
    case 'every':
      return '*';
    case 'unset':
      return '?';
    case 'specific':
      return field.value || field.raw || '0';
    case 'range': {
      const start = field.value || '0';
      const end = field.secondary || start;
      return `${start}-${end}`;
    }
    case 'step': {
      const base = field.value && field.value.length > 0 ? field.value : '*';
      const step = field.secondary || '1';
      return `${base}/${step}`;
    }
    case 'list': {
      if (field.values && field.values.length > 0) {
        return field.values.join(',');
      }
      return field.value || field.raw || '*';
    }
    case 'last':
      return field.value ? `${field.value}L` : 'L';
    case 'weekday':
      return `${field.value ?? '1'}W`;
    case 'nth':
      return `${field.value ?? '1'}#${field.secondary ?? '1'}`;
    default:
      return field.raw || '*';
  }
}

/**
 * @description 由可视化状态生成 7 段 Cron 表达式（自动日周互斥、可选 `%` 转义）
 * @param {CronState} state - 可视化状态
 * @param {GenerateOptions} [options] - 生成选项
 * @returns {GenerateResult} 生成结果（success / expression / warning）
 * @example
 * const res = generateCron(createDefaultCronState());
 * // { success: true, expression: '0 0 0 * * ? *' }
 */
export function generateCron(
  state: CronState,
  options: GenerateOptions = {},
): GenerateResult {
  const { enforceMutex = true, escapePercent = true } = options;

  if (state == null || typeof state !== 'object') {
    return {
      success: false,
      error: 'Cron 状态对象无效',
      state: createDefaultCronState(),
    };
  }

  let working = state;
  const notes: string[] = [];

  if (enforceMutex) {
    const mutex = enforceDayWeekMutex(state);
    working = mutex.state;
    if (mutex.warning) {
      notes.push(mutex.warning);
    }
  }

  const validation = validateCronState(working);
  if (!validation.valid) {
    return {
      success: false,
      error: validation.errors.join('；'),
      state: working,
      warning: [...notes, ...validation.warnings].join('；') || undefined,
    };
  }

  if (validation.warnings.length > 0) {
    notes.push(...validation.warnings);
  }

  const parts = FIELD_ORDER.map((name) => stringifyField(working[name]));
  let expression = parts.join(' ');
  if (escapePercent) {
    expression = escapeCronPercent(expression);
  }

  return {
    success: true,
    expression,
    state: working,
    warning: notes.length > 0 ? notes.join('；') : undefined,
  };
}

/**
 * @description 便捷方法：直接返回表达式字符串；失败时抛出 Error
 * @param {CronState} state - 可视化状态
 * @param {GenerateOptions} [options] - 生成选项
 * @returns {string} 7 段 Cron 表达式
 * @example
 * const expr = generateCronOrThrow(state); // '0 0 2 * * ? *'
 */
export function generateCronOrThrow(state: CronState, options?: GenerateOptions): string {
  const res = generateCron(state, options);
  if (!res.success) {
    throw new Error(res.error as string);
  }
  return res.expression as string;
}
