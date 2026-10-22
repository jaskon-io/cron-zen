/**
 * @description 对齐 cron.ren：七字段各选项生成 / 互斥 / 默认联动矩阵（每选项十余用例）
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
  describe('秒 second（每选项十余）', () => {
    it.each([
      ['every', { mode: 'every' as const, raw: '*' }, '*'],
      ['range 1-2', { mode: 'range' as const, raw: '1-2', value: '1', secondary: '2' }, '1-2'],
      ['range 0-59', { mode: 'range' as const, raw: '0-59', value: '0', secondary: '59' }, '0-59'],
      ['range 10-20', { mode: 'range' as const, raw: '10-20', value: '10', secondary: '20' }, '10-20'],
      ['step 0/1', { mode: 'step' as const, raw: '0/1', value: '0', secondary: '1' }, '0/1'],
      ['step 0/5', { mode: 'step' as const, raw: '0/5', value: '0', secondary: '5' }, '0/5'],
      ['step 0/15', { mode: 'step' as const, raw: '0/15', value: '0', secondary: '15' }, '0/15'],
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
      ['specific 0', { mode: 'specific' as const, raw: '0', value: '0' }, '0'],
      ['specific 59', { mode: 'specific' as const, raw: '59', value: '59' }, '59'],
    ])('%s', (_label, field, expected) => {
      expectField('second', field, expected, 0);
    });
  });

  describe('分钟 minute', () => {
    it.each([
      ['every', { mode: 'every' as const, raw: '*' }, '*'],
      ['range 1-2', { mode: 'range' as const, raw: '1-2', value: '1', secondary: '2' }, '1-2'],
      ['range 0-59', { mode: 'range' as const, raw: '0-59', value: '0', secondary: '59' }, '0-59'],
      ['range 5-55', { mode: 'range' as const, raw: '5-55', value: '5', secondary: '55' }, '5-55'],
      ['step 0/1', { mode: 'step' as const, raw: '0/1', value: '0', secondary: '1' }, '0/1'],
      ['step 0/5', { mode: 'step' as const, raw: '0/5', value: '0', secondary: '5' }, '0/5'],
      ['step 0/15', { mode: 'step' as const, raw: '0/15', value: '0', secondary: '15' }, '0/15'],
      ['step 0/30', { mode: 'step' as const, raw: '0/30', value: '0', secondary: '30' }, '0/30'],
      [
        'list 0,30',
        { mode: 'list' as const, raw: '0,30', value: '0,30', values: ['0', '30'] },
        '0,30',
      ],
      [
        'list 1,11',
        { mode: 'list' as const, raw: '1,11', value: '1,11', values: ['1', '11'] },
        '1,11',
      ],
      ['specific 5', { mode: 'specific' as const, raw: '5', value: '5' }, '5'],
      ['specific 0', { mode: 'specific' as const, raw: '0', value: '0' }, '0'],
    ])('%s', (_label, field, expected) => {
      expectField('minute', field, expected, 1);
    });
  });

  describe('小时 hour', () => {
    it.each([
      ['every', { mode: 'every' as const, raw: '*' }, '*'],
      ['range 0-2', { mode: 'range' as const, raw: '0-2', value: '0', secondary: '2' }, '0-2'],
      ['range 9-18', { mode: 'range' as const, raw: '9-18', value: '9', secondary: '18' }, '9-18'],
      ['range 6-23', { mode: 'range' as const, raw: '6-23', value: '6', secondary: '23' }, '6-23'],
      ['step 0/1', { mode: 'step' as const, raw: '0/1', value: '0', secondary: '1' }, '0/1'],
      ['step 0/2', { mode: 'step' as const, raw: '0/2', value: '0', secondary: '2' }, '0/2'],
      ['step 8/1', { mode: 'step' as const, raw: '8/1', value: '8', secondary: '1' }, '8/1'],
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
      [
        'list 经典多整点',
        {
          mode: 'list' as const,
          raw: '2,10,14,18',
          value: '2,10,14,18',
          values: ['2', '10', '14', '18'],
        },
        '2,10,14,18',
      ],
      ['specific 8', { mode: 'specific' as const, raw: '8', value: '8' }, '8'],
      ['specific 0', { mode: 'specific' as const, raw: '0', value: '0' }, '0'],
    ])('%s', (_label, field, expected) => {
      expectField('hour', field, expected, 2);
    });
  });

  describe('日 day', () => {
    it.each([
      ['every', { mode: 'every' as const, raw: '*' }, '*'],
      ['unset(双方?→日*)', { mode: 'unset' as const, raw: '?' }, '*'],
      ['range 1-2', { mode: 'range' as const, raw: '1-2', value: '1', secondary: '2' }, '1-2'],
      ['range 1-31', { mode: 'range' as const, raw: '1-31', value: '1', secondary: '31' }, '1-31'],
      ['range 10-20', { mode: 'range' as const, raw: '10-20', value: '10', secondary: '20' }, '10-20'],
      ['step 1/1', { mode: 'step' as const, raw: '1/1', value: '1', secondary: '1' }, '1/1'],
      ['step 1/2', { mode: 'step' as const, raw: '1/2', value: '1', secondary: '2' }, '1/2'],
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
      ['range 3-9', { mode: 'range' as const, raw: '3-9', value: '3', secondary: '9' }, '3-9'],
      ['step 1/1', { mode: 'step' as const, raw: '1/1', value: '1', secondary: '1' }, '1/1'],
      ['step 1/3', { mode: 'step' as const, raw: '1/3', value: '1', secondary: '3' }, '1/3'],
      ['step 1/6', { mode: 'step' as const, raw: '1/6', value: '1', secondary: '6' }, '1/6'],
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
      [
        'list 上半年',
        {
          mode: 'list' as const,
          raw: '1,2,3,4,5,6',
          value: '1,2,3,4,5,6',
          values: ['1', '2', '3', '4', '5', '6'],
        },
        '1,2,3,4,5,6',
      ],
      ['specific 12', { mode: 'specific' as const, raw: '12', value: '12' }, '12'],
      ['specific 1', { mode: 'specific' as const, raw: '1', value: '1' }, '1'],
      ['specific 6', { mode: 'specific' as const, raw: '6', value: '6' }, '6'],
    ])('%s', (_label, field, expected) => {
      expectField('month', field, expected, 4);
    });
  });

  describe('周 week', () => {
    it.each([
      // 点「每周」prefer=week：日=? 周=*（每周能站住）
      ['every(日=?周=*)', { mode: 'every' as const, raw: '*' }, '*'],
      ['unset', { mode: 'unset' as const, raw: '?' }, '?'],
      ['range 2-3', { mode: 'range' as const, raw: '2-3', value: '2', secondary: '3' }, '2-3'],
      ['range 2-6 工作日', { mode: 'range' as const, raw: '2-6', value: '2', secondary: '6' }, '2-6'],
      ['range 1-7', { mode: 'range' as const, raw: '1-7', value: '1', secondary: '7' }, '1-7'],
      ['nth 2#1', { mode: 'nth' as const, raw: '2#1', value: '2', secondary: '1' }, '2#1'],
      ['nth 6#2', { mode: 'nth' as const, raw: '6#2', value: '6', secondary: '2' }, '6#2'],
      ['nth 1#5', { mode: 'nth' as const, raw: '1#5', value: '1', secondary: '5' }, '1#5'],
      ['last 2L', { mode: 'last' as const, raw: '2L', value: '2' }, '2L'],
      ['last 6L', { mode: 'last' as const, raw: '6L', value: '6' }, '6L'],
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
    ])('%s → 日侧互斥', (_label, field, expected) => {
      const { updateField, expression, state } = zen();
      updateField('week', field);
      expect(expression.value.split(/\s+/)[5]).toBe(expected);
      // every / 具体值都会把日锁成 ?；仅 unset 可与日=* 共存（默认态）
      if (field.mode !== 'unset') {
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

    it('abbr list SAT,SUN', () => {
      const { updateField, setWeekFormat, expression } = zen();
      updateField('week', {
        mode: 'list',
        raw: '1,7',
        value: '1,7',
        values: ['1', '7'],
      });
      setWeekFormat('abbr');
      expect(expression.value.split(/\s+/)[5]).toMatch(/SUN|SAT/);
    });
  });

  describe('年 year', () => {
    const y = new Date().getFullYear();

    it('unset → 省略年段（不补默认 *）', () => {
      const { updateField, expression } = zen();
      updateField('year', { mode: 'unset', raw: '?' });
      const parts = expression.value.split(/\s+/);
      expect(parts).toHaveLength(6);
      expect(expression.value).toBe('* * * * * ?');
    });

    it.each([
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
        'range 2024-2030',
        {
          mode: 'range' as const,
          raw: '2024-2030',
          value: '2024',
          secondary: '2030',
        },
        '2024-2030',
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
        'step 当年/2',
        {
          mode: 'step' as const,
          raw: `${y}/2`,
          value: String(y),
          secondary: '2',
        },
        `${y}/2`,
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
        'list 三年',
        {
          mode: 'list' as const,
          raw: `${y},${y + 1},${y + 2}`,
          value: `${y},${y + 1},${y + 2}`,
          values: [String(y), String(y + 1), String(y + 2)],
        },
        `${y},${y + 1},${y + 2}`,
      ],
      [
        'specific 当年',
        { mode: 'specific' as const, raw: String(y), value: String(y) },
        String(y),
      ],
      [
        'specific 2030',
        { mode: 'specific' as const, raw: '2030', value: '2030' },
        '2030',
      ],
    ])('%s', (_label, field, expected) => {
      expectField('year', field, expected, 6);
    });
  });

  describe('跨字段组合联动（对齐 cron.ren 经典）', () => {
    it.each([
      [
        '每5分钟',
        [
          ['second', { mode: 'specific' as const, raw: '0', value: '0' }],
          ['minute', { mode: 'step' as const, raw: '0/5', value: '0', secondary: '5' }],
        ],
        '0 0/5 * * * ?',
      ],
      [
        '每30分钟',
        [
          ['second', { mode: 'specific' as const, raw: '0', value: '0' }],
          [
            'minute',
            {
              mode: 'list' as const,
              raw: '0,30',
              value: '0,30',
              values: ['0', '30'],
            },
          ],
        ],
        '0 0,30 * * * ?',
      ],
      [
        '工作日9-18',
        [
          ['second', { mode: 'specific' as const, raw: '0', value: '0' }],
          ['minute', { mode: 'specific' as const, raw: '0', value: '0' }],
          ['hour', { mode: 'range' as const, raw: '9-18', value: '9', secondary: '18' }],
          ['week', { mode: 'range' as const, raw: '2-6', value: '2', secondary: '6' }],
        ],
        '0 0 9-18 ? * 2-6',
      ],
      [
        '每月1号',
        [
          ['second', { mode: 'specific' as const, raw: '0', value: '0' }],
          ['minute', { mode: 'specific' as const, raw: '0', value: '0' }],
          ['hour', { mode: 'specific' as const, raw: '0', value: '0' }],
          ['day', { mode: 'specific' as const, raw: '1', value: '1' }],
        ],
        '0 0 0 1 * ?',
      ],
      [
        '月末23点',
        [
          ['second', { mode: 'specific' as const, raw: '0', value: '0' }],
          ['minute', { mode: 'specific' as const, raw: '0', value: '0' }],
          ['hour', { mode: 'specific' as const, raw: '23', value: '23' }],
          ['day', { mode: 'last' as const, raw: 'L' }],
        ],
        '0 0 23 L * ?',
      ],
      [
        '季度初',
        [
          ['second', { mode: 'specific' as const, raw: '0', value: '0' }],
          ['minute', { mode: 'specific' as const, raw: '0', value: '0' }],
          ['hour', { mode: 'specific' as const, raw: '2', value: '2' }],
          ['day', { mode: 'specific' as const, raw: '1', value: '1' }],
          [
            'month',
            {
              mode: 'list' as const,
              raw: '1,4,7,10',
              value: '1,4,7,10',
              values: ['1', '4', '7', '10'],
            },
          ],
        ],
        '0 0 2 1 1,4,7,10 ?',
      ],
    ] as const)('%s', (_label, steps, expected) => {
      const { updateField, expression } = zen();
      for (const [name, field] of steps) {
        updateField(name as CronFieldName, field as CronFieldState);
      }
      expect(expression.value).toBe(expected);
    });
  });
});
