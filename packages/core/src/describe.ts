import type { CronFieldState, CronState } from './types';
import { quartzWeekShortLabel } from './week';

/**
 * @description 将单个字段状态转为简短中文描述片段
 * @param {string} label - 字段中文名
 * @param {CronFieldState} field - 字段状态
 * @returns {string} 描述片段；every/unset 返回空串
 * @example
 * describeField('小时', { mode: 'specific', raw: '2', value: '2' }); // '在 2 小时'
 */
export function describeField(label: string, field: CronFieldState): string {
  switch (field.mode) {
    case 'every':
    case 'unset':
      return '';
    case 'specific':
      return `在 ${field.value ?? field.raw} ${label}`;
    case 'range':
      return `${label} ${field.value}-${field.secondary}`;
    case 'step':
      return `每 ${field.secondary ?? '1'} ${label}（从 ${field.value || '*'}）`;
    case 'list': {
      const items = (field.values ?? field.value?.split(',') ?? []).filter(Boolean);
      return items.length > 0 ? `${label}为 ${items.join('、')}` : '';
    }
    case 'last':
      return field.value
        ? `最后一个星期${quartzWeekShortLabel(field.value)}`
        : '最后一天';
    case 'weekday':
      return `最接近 ${field.value} 号的工作日`;
    case 'nth':
      return `第 ${field.secondary} 个星期${quartzWeekShortLabel(field.value ?? '')}`;
    default:
      return field.raw;
  }
}

/**
 * @description 将 Cron 可视化状态转为自然语言摘要（中文）
 * @param {CronState} state - 可视化状态
 * @returns {string} 自然语言描述
 * @example
 * describeCron(createDefaultCronState()); // '每天'
 */
export function describeCron(state: CronState): string {
  const parts: string[] = [];

  if (state.year.mode === 'specific') {
    parts.push(`${state.year.value} 年`);
  } else if (state.year.mode !== 'every') {
    const y = describeField('年', state.year);
    if (y) parts.push(y);
  }

  if (state.month.mode !== 'every') {
    const m = describeField('月', state.month);
    if (m) parts.push(m);
  }

  if (state.week.mode !== 'every' && state.week.mode !== 'unset') {
    const w = describeField('周', state.week);
    if (w) parts.push(w);
  } else if (state.day.mode !== 'every' && state.day.mode !== 'unset') {
    const d = describeField('日', state.day);
    if (d) parts.push(d);
  } else {
    parts.push('每天');
  }

  const timeBits: string[] = [];
  if (state.hour.mode === 'specific') {
    timeBits.push(`${state.hour.value} 时`);
  } else {
    const h = describeField('小时', state.hour);
    if (h) timeBits.push(h);
  }
  if (state.minute.mode === 'specific') {
    timeBits.push(`${state.minute.value} 分`);
  } else {
    const m = describeField('分', state.minute);
    if (m) timeBits.push(m);
  }
  if (state.second.mode === 'specific') {
    timeBits.push(`${state.second.value} 秒`);
  } else {
    const s = describeField('秒', state.second);
    if (s) timeBits.push(s);
  }

  if (timeBits.length > 0) {
    parts.push(timeBits.join(' '));
  }

  return parts.join(' ').replace(/\s+/g, ' ').trim() || '自定义调度';
}
