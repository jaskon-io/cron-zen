import type { CronFieldName, CronFieldState, CronState } from './types';
import { resolveLocale, type CronLocaleInput, type CronLocaleMessages } from './i18n';
import { weekAbbrToNumber } from './week';

/**
 * @description describe 选项
 */
export interface DescribeOptions {
  /** @description 语言：zh-CN（默认）/ en-US / 自定义文案包 */
  locale?: CronLocaleInput;
}

/**
 * @description 将周 token 转为当前 locale 的全称标签
 * @param {string | undefined} token - 数字或 SUN…SAT
 * @param {CronLocaleMessages} messages - 文案
 * @returns {string}
 */
function formatWeekToken(
  token: string | undefined,
  messages: CronLocaleMessages,
): string {
  if (token == null || token === '') return '';
  if (typeof token === 'string') {
    const abbrNum = weekAbbrToNumber(token);
    if (abbrNum != null) return messages.weekDayFull[abbrNum] ?? token;
  }
  const n = Number(token);
  if (Number.isFinite(n) && messages.weekDayFull[n]) {
    return messages.weekDayFull[n];
  }
  return String(token);
}

/**
 * @description 周短标签
 * @param {string | number | undefined} token - token
 * @param {CronLocaleMessages} messages - 文案
 * @returns {string}
 */
function formatWeekShort(
  token: string | number | undefined,
  messages: CronLocaleMessages,
): string {
  if (token == null || token === '') return '';
  if (typeof token === 'string') {
    const abbrNum = weekAbbrToNumber(token);
    if (abbrNum != null) return messages.weekDayShort[abbrNum] ?? token;
  }
  const n = typeof token === 'number' ? token : Number(token);
  if (Number.isFinite(n) && messages.weekDayShort[n]) {
    return messages.weekDayShort[n];
  }
  return String(token);
}

/**
 * @description 将单个字段状态转为简短描述片段
 * @param {CronFieldName | string} fieldKeyOrLabel - 字段名（推荐）或旧版中文 label
 * @param {CronFieldState} field - 字段状态
 * @param {DescribeOptions} [options] - locale 等
 * @returns {string} 描述片段；every/unset 返回空串
 * @example
 * describeField('hour', { mode: 'specific', raw: '2', value: '2' }, { locale: 'en-US' });
 */
export function describeField(
  fieldKeyOrLabel: CronFieldName | string,
  field: CronFieldState,
  options?: DescribeOptions,
): string {
  const messages = resolveLocale(options?.locale);
  const name = resolveFieldName(fieldKeyOrLabel, messages);
  const unit = name ? messages.fieldUnits[name] : fieldKeyOrLabel;
  const isWeek = name === 'week' || fieldKeyOrLabel === '周';

  switch (field.mode) {
    case 'every':
    case 'unset':
      return '';
    case 'specific': {
      if (isWeek) {
        const day = formatWeekToken(field.value ?? field.raw, messages);
        return day ? messages.everyWeekday(day) : '';
      }
      return messages.atUnit(field.value ?? field.raw, unit);
    }
    case 'range': {
      if (isWeek) {
        const from = formatWeekToken(field.value, messages);
        const to = formatWeekToken(field.secondary, messages);
        if (from && to) return messages.weekRange(from, to);
      }
      return messages.range(unit, field.value ?? '', field.secondary ?? '');
    }
    case 'step':
      return messages.step(field.secondary ?? '1', unit, field.value || '*');
    case 'list': {
      const items = (field.values ?? field.value?.split(',') ?? []).filter(Boolean);
      if (items.length === 0) return '';
      if (isWeek) {
        return messages.listJoin(
          items.map((t) => formatWeekToken(t, messages)).filter(Boolean),
        );
      }
      return messages.list(unit, items.join(messages.code === 'zh-CN' ? '、' : ', '));
    }
    case 'last':
      return field.value
        ? messages.lastWeekdayOfMonth(formatWeekShort(field.value, messages))
        : messages.lastDay;
    case 'lastWeekday':
      return messages.lastWorkday;
    case 'weekday':
      return messages.nearestWorkday(String(field.value ?? ''));
    case 'nth':
      return messages.nthWeekday(
        String(field.secondary ?? ''),
        formatWeekShort(field.value ?? '', messages),
      );
    default:
      return field.raw;
  }
}

/**
 * @description 兼容旧调用：中文 label → 字段名
 * @param {string} keyOrLabel - 入参
 * @param {CronLocaleMessages} messages - 文案
 * @returns {CronFieldName | null}
 */
function resolveFieldName(
  keyOrLabel: string,
  messages: CronLocaleMessages,
): CronFieldName | null {
  const keys: CronFieldName[] = [
    'second',
    'minute',
    'hour',
    'day',
    'month',
    'week',
    'year',
  ];
  if ((keys as string[]).includes(keyOrLabel)) {
    return keyOrLabel as CronFieldName;
  }
  // 旧版中文 label
  const zhMap: Record<string, CronFieldName> = {
    秒: 'second',
    分: 'minute',
    分钟: 'minute',
    小时: 'hour',
    日: 'day',
    月: 'month',
    周: 'week',
    年: 'year',
  };
  if (zhMap[keyOrLabel]) return zhMap[keyOrLabel];
  for (const k of keys) {
    if (messages.fieldUnits[k] === keyOrLabel || messages.tabs[k] === keyOrLabel) {
      return k;
    }
  }
  return null;
}

/**
 * @description 将 Cron 可视化状态转为自然语言摘要
 * @param {CronState} state - 可视化状态
 * @param {DescribeOptions} [options] - locale 等
 * @returns {string} 自然语言描述
 * @example
 * describeCron(createDefaultCronState()); // '每天'
 * describeCron(state, { locale: 'en-US' }); // 'Every day'
 */
export function describeCron(state: CronState, options?: DescribeOptions): string {
  const messages = resolveLocale(options?.locale);
  const parts: string[] = [];
  const opt = { locale: messages };

  if (state.year.mode === 'specific') {
    parts.push(messages.yearSpecific(String(state.year.value ?? '')));
  } else if (state.year.mode !== 'every') {
    const y = describeField('year', state.year, opt);
    if (y) parts.push(y);
  }

  if (state.month.mode !== 'every') {
    const m = describeField('month', state.month, opt);
    if (m) parts.push(m);
  }

  if (state.week.mode !== 'every' && state.week.mode !== 'unset') {
    const w = describeField('week', state.week, opt);
    if (w) parts.push(w);
  } else if (state.day.mode !== 'every' && state.day.mode !== 'unset') {
    const d = describeField('day', state.day, opt);
    if (d) parts.push(d);
  } else {
    parts.push(messages.everyDay);
  }

  const timeBits: string[] = [];
  if (state.hour.mode === 'specific') {
    timeBits.push(messages.hourSpecific(String(state.hour.value ?? '')));
  } else {
    const h = describeField('hour', state.hour, opt);
    if (h) timeBits.push(h);
  }
  if (state.minute.mode === 'specific') {
    timeBits.push(messages.minuteSpecific(String(state.minute.value ?? '')));
  } else {
    const m = describeField('minute', state.minute, opt);
    if (m) timeBits.push(m);
  }
  if (state.second.mode === 'specific') {
    timeBits.push(messages.secondSpecific(String(state.second.value ?? '')));
  } else {
    const s = describeField('second', state.second, opt);
    if (s) timeBits.push(s);
  }

  if (timeBits.length > 0) {
    parts.push(timeBits.join(' '));
  }

  return parts.join(' ').replace(/\s+/g, ' ').trim() || messages.customSchedule;
}
