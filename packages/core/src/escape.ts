/**
 * @description 转义 Cron 表达式中的 `%`，避免部分调度系统将其当作参数分隔符导致解析失败
 * @param {string} expression - 原始 Cron 表达式
 * @returns {string} 转义后的表达式（`%` → `\%`；已转义的不重复处理）
 * @example
 * escapeCronPercent('0 0 2 * * ? * %job'); // '0 0 2 * * ? * \\%job'
 */
export function escapeCronPercent(expression: string): string {
  return expression.replace(/(?<!\\)%/g, '\\%');
}

/**
 * @description 还原被 escapeCronPercent 转义的 `%`
 * @param {string} expression - 可能含 `\%` 的表达式
 * @returns {string} 还原后的表达式
 * @example
 * unescapeCronPercent('0 0 2 * * ? * \\%job'); // '0 0 2 * * ? * %job'
 */
export function unescapeCronPercent(expression: string): string {
  return expression.replace(/\\%/g, '%');
}
