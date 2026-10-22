import { describe, it, expect } from 'vitest';
import {
  createDefaultCronState,
  createEveryField,
  createUnsetField,
} from '../src/types';
import { expandFieldValues, formatRunTime, getNextRuns } from '../src/nextRuns';

describe('expandFieldValues', () => {
  it('应展开常见模式', () => {
    expect(expandFieldValues({ mode: 'every', raw: '*' }, 1, 3)).toEqual([1, 2, 3]);
    expect(expandFieldValues({ mode: 'unset', raw: '?' }, 0, 1)).toEqual([0, 1]);
    expect(expandFieldValues({ mode: 'specific', raw: '2', value: '2' }, 0, 23)).toEqual([2]);
    expect(expandFieldValues({ mode: 'specific', raw: 'x', value: 'x' }, 0, 23)).toBeNull();
    expect(
      expandFieldValues({ mode: 'list', raw: '1,3', values: ['1', '3'] }, 0, 10),
    ).toEqual([1, 3]);
    expect(expandFieldValues({ mode: 'list', raw: 'a', value: 'a' }, 0, 10)).toBeNull();
    expect(expandFieldValues({ mode: 'list', raw: '' }, 0, 10)).toBeNull();
    expect(
      expandFieldValues({ mode: 'list', raw: '2', value: '2' }, 0, 10),
    ).toEqual([2]);
    expect(
      expandFieldValues({ mode: 'range', raw: '2-4', value: '2', secondary: '4' }, 0, 10),
    ).toEqual([2, 3, 4]);
    expect(
      expandFieldValues({ mode: 'range', raw: '5-1', value: '5', secondary: '1' }, 0, 10),
    ).toBeNull();
    expect(
      expandFieldValues({ mode: 'step', raw: '0/2', value: '0', secondary: '2' }, 0, 5),
    ).toEqual([0, 2, 4]);
    expect(
      expandFieldValues({ mode: 'step', raw: '*/2', value: '*', secondary: '2' }, 0, 4),
    ).toEqual([0, 2, 4]);
    expect(
      expandFieldValues({ mode: 'step', raw: 'x/2', value: 'x', secondary: '2' }, 0, 4),
    ).toBeNull();
    expect(
      expandFieldValues({ mode: 'step', raw: '0/0', value: '0', secondary: '0' }, 0, 4),
    ).toBeNull();
    expect(expandFieldValues({ mode: 'last', raw: 'L' }, 1, 31)).toBeNull();
  });
});

describe('getNextRuns / formatRunTime', () => {
  it('默认每天 0 点应返回未来触发点', () => {
    const from = new Date(2026, 0, 1, 12, 0, 0);
    const runs = getNextRuns(createDefaultCronState(), 3, from);
    expect(runs).toHaveLength(3);
    expect(runs[0].getHours()).toBe(0);
    expect(formatRunTime(runs[0])).toMatch(/^\d{4}-\d{2}-\d{2} 00:00:00$/);
  });

  it('无法展开的字段应返回空数组', () => {
    const state = createDefaultCronState();
    state.day = { mode: 'last', raw: 'L' };
    expect(getNextRuns(state, 5, new Date(2026, 0, 1))).toEqual([]);
  });

  it('应按周过滤并尊重年份', () => {
    const state = createDefaultCronState();
    state.day = createUnsetField();
    state.week = { mode: 'specific', raw: '1', value: '1' }; // 周一
    state.year = { mode: 'specific', raw: '2026', value: '2026' };
    const from = new Date(2026, 0, 1, 0, 0, 0); // 周四
    const runs = getNextRuns(state, 2, from);
    expect(runs.length).toBeGreaterThan(0);
    expect(runs[0].getDay()).toBe(1);
    expect(runs[0].getFullYear()).toBe(2026);
  });

  it('月不匹配时应跳过', () => {
    const state = createDefaultCronState();
    state.month = { mode: 'specific', raw: '12', value: '12' };
    const from = new Date(2026, 0, 1, 0, 0, 0);
    const runs = getNextRuns(state, 1, from);
    expect(runs[0].getMonth()).toBe(11);
  });

  it('日具体值应过滤', () => {
    const state = createDefaultCronState();
    state.day = { mode: 'specific', raw: '15', value: '15' };
    const from = new Date(2026, 0, 1, 0, 0, 0);
    const runs = getNextRuns(state, 1, from);
    expect(runs[0].getDate()).toBe(15);
  });

  it('年份不匹配时应跳过直至命中', () => {
    const state = createDefaultCronState();
    state.year = { mode: 'specific', raw: '2028', value: '2028' };
    const from = new Date(2026, 0, 1, 0, 0, 0);
    const runs = getNextRuns(state, 1, from);
    expect(runs[0].getFullYear()).toBe(2028);
  });

  it('扫描窗口内不足 count 时应返回已有结果', () => {
    const state = createDefaultCronState();
    state.year = { mode: 'specific', raw: '2026', value: '2026' };
    state.month = { mode: 'specific', raw: '1', value: '1' };
    state.day = { mode: 'specific', raw: '2', value: '2' };
    // from 已过 1/2，且年份锁 2026，之后再无命中
    const from = new Date(2026, 0, 2, 12, 0, 0);
    const runs = getNextRuns(state, 5, from);
    expect(runs.length).toBeLessThan(5);
  });
});
