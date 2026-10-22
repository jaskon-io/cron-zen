import { describe, it, expect } from 'vitest';
import {
  FIELD_ORDER,
  FIELD_RANGES,
  createDefaultCronState,
  createEveryField,
  createUnsetField,
} from '../src/types';

describe('types helpers', () => {
  it('FIELD_ORDER 应为 7 段顺序', () => {
    expect(FIELD_ORDER).toEqual([
      'second',
      'minute',
      'hour',
      'day',
      'month',
      'week',
      'year',
    ]);
  });

  it('FIELD_RANGES 应覆盖全部字段合法区间', () => {
    expect(FIELD_RANGES.second).toEqual({ name: 'second', min: 0, max: 59 });
    expect(FIELD_RANGES.hour).toEqual({ name: 'hour', min: 0, max: 23 });
    expect(FIELD_RANGES.day).toEqual({ name: 'day', min: 1, max: 31 });
    expect(FIELD_RANGES.month).toEqual({ name: 'month', min: 1, max: 12 });
    expect(FIELD_RANGES.week).toEqual({ name: 'week', min: 0, max: 7 });
    expect(FIELD_RANGES.year.min).toBe(1970);
  });

  it('createEveryField / createUnsetField 应返回正确模式', () => {
    expect(createEveryField()).toEqual({ mode: 'every', raw: '*' });
    expect(createUnsetField()).toEqual({ mode: 'unset', raw: '?' });
    expect(createEveryField('ALL')).toEqual({ mode: 'every', raw: 'ALL' });
  });

  it('createDefaultCronState 应对齐 cron.ren（年不指定）', () => {
    const state = createDefaultCronState();
    expect(state.second.mode).toBe('every');
    expect(state.minute.mode).toBe('every');
    expect(state.hour.mode).toBe('every');
    expect(state.day.mode).toBe('every');
    expect(state.month.mode).toBe('every');
    expect(state.week.mode).toBe('unset');
    expect(state.year.mode).toBe('unset');
  });
});

