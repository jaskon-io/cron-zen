/**
 * @description 触发时间展示文案（仅展示用，不改表达式逻辑）
 * 优先命中业务频率名；否则自动语义化，并附带下次执行时间
 */
import { describeCron } from './describe';
import { formatRunTime, getNextRuns } from './nextRuns';
import { parseCron } from './parser';
import type { DescribeOptions } from './describe';
import type { TimeZoneOptions } from './nextRuns';

/**
 * @description 业务侧预设频率项（表达式 ↔ 展示名）
 */
export type CronFrequencyOption = {
  /** @description Quartz Cron 表达式 */
  cronExpression: string;
  /** @description 业务展示名，如「每天 9 点」 */
  frequencyName: string;
};

/**
 * @description resolveCronDisplay 结果
 */
export type CronDisplayInfo = {
  /** @description 语义文案（频率名或自动描述） */
  description: string;
  /** @description 下次执行：YYYY-MM-DD HH:mm:ss；无法估算时为空 */
  nextRun: string;
  /** @description 是否命中业务频率表 */
  matched: boolean;
};

/**
 * @description resolveCronDisplay 选项
 */
export interface ResolveCronDisplayOptions {
  /** @description 业务频率列表 */
  frequencyOptions?: CronFrequencyOption[];
  /** @description describe / 下次执行 locale */
  locale?: DescribeOptions['locale'];
  /** @description 下次执行时区 */
  timeZone?: TimeZoneOptions['timeZone'];
}

/**
 * @description 规范化 cron 便于与频率表比对（全角？、多空格、年段 *）
 * @param {string} expr - 原始表达式
 * @returns {string}
 * @example
 * normalizeCronKey('0 0 9 * * ? *'); // '0 0 9 * * ?'
 */
export function normalizeCronKey(expr: string): string {
  let s = (expr ?? '').trim().replace(/？/g, '?').replace(/\s+/g, ' ');
  const parts = s.split(' ');
  if (parts.length === 7 && parts[6] === '*') {
    s = parts.slice(0, 6).join(' ');
  }
  return s;
}

/**
 * @description 解析展示文案：频率表优先，否则 describeCron；另算下次执行
 * @param {string} cronExpression - 当前表达式
 * @param {ResolveCronDisplayOptions | CronFrequencyOption[]} [optionsOrFrequencies] - 选项或频率表（兼容数组简写）
 * @returns {CronDisplayInfo}
 * @example
 * resolveCronDisplay('0 0/5 * * * ?');
 * // { description: '每5分钟执行', nextRun: '下次执行：…', matched: false }
 *
 * resolveCronDisplay('0 0 9 * * ?', [
 *   { cronExpression: '0 0 9 * * ?', frequencyName: '每天上午9点' },
 * ]);
 */
export function resolveCronDisplay(
  cronExpression: string,
  optionsOrFrequencies: ResolveCronDisplayOptions | CronFrequencyOption[] = [],
): CronDisplayInfo {
  const options: ResolveCronDisplayOptions = Array.isArray(optionsOrFrequencies)
    ? { frequencyOptions: optionsOrFrequencies }
    : optionsOrFrequencies ?? {};
  const frequencyOptions = options.frequencyOptions ?? [];
  const locale = options.locale ?? 'zh-CN';
  const tzOpt = options.timeZone ? { timeZone: options.timeZone } : undefined;

  const value = (cronExpression ?? '').trim();
  if (!value) {
    return { description: '', nextRun: '', matched: false };
  }

  const map = new Map<string, string>();
  for (const item of frequencyOptions) {
    const key = normalizeCronKey(item.cronExpression ?? '');
    const name = (item.frequencyName ?? '').trim();
    if (key && name && !map.has(key)) {
      map.set(key, name);
    }
  }

  let description = map.get(normalizeCronKey(value)) ?? '';
  let matched = Boolean(description);
  const parsed = parseCron(value);

  if (!description && parsed.success && parsed.expression) {
    const byNormalized = map.get(normalizeCronKey(parsed.expression));
    if (byNormalized) {
      description = byNormalized;
      matched = true;
    }
  }

  if (!description && parsed.success && parsed.state) {
    try {
      description = describeCron(parsed.state, { locale }) || '';
    } catch {
      description = '';
    }
  }

  let nextRun = '';
  if (parsed.success && parsed.state) {
    try {
      const runs = getNextRuns(parsed.state, 1, new Date(), tzOpt);
      if (runs.length) {
        const text = formatRunTime(runs[0], tzOpt);
        if (text) nextRun = `下次执行：${text}`;
      }
    } catch {
      nextRun = '';
    }
  }

  return { description, nextRun, matched };
}
