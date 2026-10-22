/**
 * @description 对齐 cron.ren：七字段各选项生成 / 互斥 / 默认联动矩阵
 */
import { describe, it, expect } from 'vitest';
import { useCronZen } from '../src/composables/useCronZen';
import type { CronFieldName, CronFieldState } from '@cron-zen/core';

function zen() {
  return useCronZen({ debounceMs: 0 });
}

function expectField(
  name: CronFieldName,
  field: CronFieldState,
  expectPart: string | RegExp,
  index: number,
): void {
  const { updateField, expression } = zen();
  updateField(name, field);
  const part = expression.value.split(/\s+/)[index];
  if (typeof expectPart === 'string') {
    expect(part).toBe(expectPart);
  } else {
    expect(part).toMatch(expectPart);
  }
}

describe('字段选项矩阵（对齐 cron.ren）', () => {
  describe('秒 second', () => {
    it.each([
      ['every', { mode: 'every' as const, raw: '*' }, '*'],
      ['range 1-2', { mode: 'range' as const, raw: '1-2', value: '1', secondary: '2' }, '1-2'],
      ['range 0-59', { mode: 'range' as const, raw: '0-59', value: '0', secondary: '59' }, '0-59'],
      ['step 0/5', { mode: 'step' as const, raw: '0/5', value: '0', secondary: '5' }, '0/5'],
      ['step 10/10', { mode: 'step' as const, raw: '10/10', value: '10', secondary: '10' }, '10/10'],
      [
        'list 0,15,30,45',
        {
          mode: 'list' as const,
          raw: '0,15,30,45',
          value: '0,15,30,45',
          values: ['0', '15', '30', '45'],
        },
        '0,15,30,45',
      ],
      [
        'list 单值',
        { mode: 'list' as const, raw: '7', value: '7', values: ['7'] },
        '7',
      ],
      [
        'specific 0',
        { mode: 'specific' as const, raw: '0', value: '0' },
        '0',
      ],
    ])('%s', (_label, field, expected) => {
      expectField('second', field, expected, 0);
    });
  });

  describe('分钟 minute', () => {
    it.each([
      ['every', { mode: 'every' as const, raw: '*' }, '*'],
      ['range 1-2', { mode: 'range' as const, raw: '1-2', value: '1', secondary: '2' }, '1-2'],
      ['step 0/1', { mode: 'step' as const, raw: '0/1', value: '0', secondary: '1' }, '0/1'],
      ['step 0/15', { mode: 'step' as const, raw: '0/15', value: '0', secondary: '15' }, '0/15'],
      [
        'list 0,30',
        { mode: 'list' as const, raw: '0,30', value: '0,30', values: ['0', '30'] },
        '0,30',
      ],
      ['specific 5', { mode: 'specific' as const, raw: '5', value: '5' }, '5'],
    ])('%s', (_label, field, expected) => {
      expectField('minute', field, expected, 1);
    });
  });

  describe('小时 hour', () => {
    it.each([
      ['every', { mode: 'every' as const, raw: '*' }, '*'],
      ['range 0-2', { mode: 'range' as const, raw: '0-2', value: '0', secondary: '2' }, '0-2'],
      ['range 9-18', { mode: 'range' as const, raw: '9-18', value: '9', secondary: '18' }, '9-18'],
      ['step 0/1', { mode: 'step' as const, raw: '0/1', value: '0', secondary: '1' }, '0/1'],
      [
        'list AM',
        {
          mode: 'list' as const,
          raw: '0,1,2',
          value: '0,1,2',
          values: ['0', '1', '2'],
        },
        '0,1,2',
      ],
      [
        'list PM',
        {
          mode: 'list' as const,
          raw: '12,13,18,23',
          value: '12,13,18,23',
          values: ['12', '13', '18', '23'],
        },
        '12,13,18,23',
      ],
      ['specific 8', { mode: 'specific' as const, raw: '8', value: '8' }, '8'],
    ])('%s', (_label, field, expected) => {
      expectField('hour', field, expected, 2);
    });
  });

  describe('日 day', () => {
    it.each([
      // 日/周皆 ? 时 Quartz 惯例会把日规范为 *
      ['every', { mode: 'every' as const, raw: '*' }, '*'],
      ['unset(双方?→日*)', { mode: 'unset' as const, raw: '?' }, '*'],
      ['range 1-2', { mode: 'range' as const, raw: '1-2', value: '1', secondary: '2' }, '1-2'],
      ['step 1/1', { mode: 'step' as const, raw: '1/1', value: '1', secondary: '1' }, '1/1'],
      ['weekday 1W', { mode: 'weekday' as const, raw: '1W', value: '1' }, '1W'],
      ['weekday 15W', { mode: 'weekday' as const, raw: '15W', value: '15' }, '15W'],
      ['last L', { mode: 'last' as const, raw: 'L' }, 'L'],
      [
        'list 1,15',
        { mode: 'list' as const, raw: '1,15', value: '1,15', values: ['1', '15'] },
        '1,15',
      ],
      ['specific 15', { mode: 'specific' as const, raw: '15', value: '15' }, '15'],
    ])('%s → 周自动 ?', (_label, field, expected) => {
      const { updateField, expression, state } = zen();
      updateField('day', field);
      expect(expression.value.split(/\s+/)[3]).toBe(expected);
      if (field.mode !== 'every' && field.mode !== 'unset') {
        expect(state.value.week.mode).toBe('unset');
        expect(expression.value.split(/\s+/)[5]).toBe('?');
      }
    });
  });


  describe('月 month', () => {
    it.each([
      ['every', { mode: 'every' as const, raw: '*' }, '*'],
      ['range 1-2', { mode: 'range' as const, raw: '1-2', value: '1', secondary: '2' }, '1-2'],
      ['range 1-12', { mode: 'range' as const, raw: '1-12', value: '1', secondary: '12' }, '1-12'],
      ['step 1/1', { mode: 'step' as const, raw: '1/1', value: '1', secondary: '1' }, '1/1'],
      ['step 1/3', { mode: 'step' as const, raw: '1/3', value: '1', secondary: '3' }, '1/3'],
      [
        'list 季度',
        {
          mode: 'list' as const,
          raw: '1,4,7,10',
          value: '1,4,7,10',
          values: ['1', '4', '7', '10'],
        },
        '1,4,7,10',
      ],
      ['specific 12', { mode: 'specific' as const, raw: '12', value: '12' }, '12'],
    ])('%s', (_label, field, expected) => {
      expectField('month', field, expected, 4);
    });
  });

  describe('周 week', () => {
    it.each([
      // 日/周皆 * 时惯例把周规范为 ?
      ['every(双方*→周?)', { mode: 'every' as const, raw: '*' }, '?'],
      ['unset', { mode: 'unset' as const, raw: '?' }, '?'],
      ['range 2-3 周一到周二', { mode: 'range' as const, raw: '2-3', value: '2', secondary: '3' }, '2-3'],
      ['range 2-6 工作日', { mode: 'range' as const, raw: '2-6', value: '2', secondary: '6' }, '2-6'],
      ['nth 2#1 第一个周一', { mode: 'nth' as const, raw: '2#1', value: '2', secondary: '1' }, '2#1'],
      ['nth 6#2 第二个周五', { mode: 'nth' as const, raw: '6#2', value: '6', secondary: '2' }, '6#2'],
      ['last 2L 最后一个周一', { mode: 'last' as const, raw: '2L', value: '2' }, '2L'],
      ['last 6L 最后一个周五', { mode: 'last' as const, raw: '6L', value: '6' }, '6L'],
      [
        'list 周一三五',
        {
          mode: 'list' as const,
          raw: '2,4,6',
          value: '2,4,6',
          values: ['2', '4', '6'],
        },
        '2,4,6',
      ],
      ['specific 1 周日', { mode: 'specific' as const, raw: '1', value: '1' }, '1'],
      ['specific 7 周六', { mode: 'specific' as const, raw: '7', value: '7' }, '7'],
    ])('%s → 日自动 ?', (_label, field, expected) => {
      const { updateField, expression, state } = zen();
      updateField('week', field);
      expect(expression.value.split(/\s+/)[5]).toBe(expected);
      if (field.mode !== 'every' && field.mode !== 'unset') {
        expect(state.value.day.mode).toBe('unset');
        expect(expression.value.split(/\s+/)[3]).toBe('?');
      }
    });


    it('abbr 写法应将 2 输出为 MON', () => {
      const { updateField, setWeekFormat, expression } = zen();
      updateField('week', { mode: 'specific', raw: '2', value: '2' });
      setWeekFormat('abbr');
      expect(expression.value.split(/\s+/)[5]).toBe('MON');
    });

    it('abbr 区间 2-6 应为 MON-FRI', () => {
      const { updateField, setWeekFormat, expression } = zen();
      updateField('week', {
        mode: 'range',
        raw: '2-6',
        value: '2',
        secondary: '6',
      });
      setWeekFormat('abbr');
      expect(expression.value.split(/\s+/)[5]).toBe('MON-FRI');
    });
  });

  describe('年 year', () => {
    const y = new Date().getFullYear();
    it.each([
      ['unset → *', { mode: 'unset' as const, raw: '?' }, '*'],
      ['every', { mode: 'every' as const, raw: '*' }, '*'],
      [
        'range 当年-次年',
        {
          mode: 'range' as const,
          raw: `${y}-${y + 1}`,
          value: String(y),
          secondary: String(y + 1),
        },
        `${y}-${y + 1}`,
      ],
      [
        'step 当年/1',
        {
          mode: 'step' as const,
          raw: `${y}/1`,
          value: String(y),
          secondary: '1',
        },
        `${y}/1`,
      ],
      [
        'list 两年',
        {
          mode: 'list' as const,
          raw: `${y},${y + 1}`,
          value: `${y},${y + 1}`,
          values: [String(y), String(y + 1)],
        },
        `${y},${y + 1}`,
      ],
      [
        'specific 当年',
        { mode: 'specific' as const, raw: String(y), value: String(y) },
        String(y),
      ],
    ])('%s', (_label, field, expected) => {
      expectField('year', field, expected, 6);
    });
  });
});
