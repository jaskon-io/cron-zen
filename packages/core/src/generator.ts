import {
  type CronState,
  type GenerateOptions,
  type GenerateResult,
  FIELD_ORDER,
  createDefaultCronState,
} from './types';
import { escapeCronPercent } from './escape';
import { enforceDayWeekMutex, validateCronState } from './validator';
import { stringifyField } from './stringify';

export { stringifyField } from './stringify';

/**
 * @description 由可视化状态生成 7 段 Cron 表达式（自动日周互斥、可选 `%` 转义）
 * @param {CronState} state - 可视化状态
 * @param {GenerateOptions} [options] - 生成选项
 * @returns {GenerateResult} 生成结果（success / expression / warning）
 * @example
 * const res = generateCron(createDefaultCronState());
 * // { success: true, expression: '* * * * * ? *' }
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

  const weekFormat = options.weekFormat ?? 'number';
  const parts = FIELD_ORDER.map((name) =>
    stringifyField(working[name], { fieldName: name, weekFormat }),
  );
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
