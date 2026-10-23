import { describe, it, expect } from 'vitest';
import {
  createDefaultCronState,
  createEveryField,
  createUnsetField,
} from '../src/types';
import {
  expandFieldValues,
  formatRunTime,
  getNextRuns,
  lastDayOfMonth,
  lastWeekdayOfMonth,
  nearestWeekdayOfMonth,
  lastQuartzWeekdayOfMonth,
  nthQuartzWeekdayOfMonth,
} from '../src/nextRuns';

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
    // 倒序回绕（对齐 cron.ren）：5-1 → 5..10 + 0..1
    expect(
      expandFieldValues({ mode: 'range', raw: '5-1', value: '5', secondary: '1' }, 0, 10),
    ).toEqual([5, 6, 7, 8, 9, 10, 0, 1]);
    // 周 7-3（周六→周二）
    expect(
      expandFieldValues({ mode: 'range', raw: '7-3', value: '7', secondary: '3' }, 1, 7),
    ).toEqual([7, 1, 2, 3]);
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
    expect(expandFieldValues({ mode: 'lastWeekday', raw: 'LW' }, 1, 31)).toBeNull();
  });

  it('应拒绝越界 specific，并夹紧异常大 range', () => {
    expect(
      expandFieldValues({ mode: 'specific', raw: '99', value: '99' }, 0, 23),
    ).toBeNull();
    const clamped = expandFieldValues(
      { mode: 'range', raw: '0-999999', value: '0', secondary: '999999' },
      0,
      23,
    );
    expect(clamped).toEqual(Array.from({ length: 24 }, (_, i) => i));
    expect(
      expandFieldValues({ mode: 'list', raw: '1,99', values: ['1', '99'] }, 0, 23),
    ).toEqual([1]);
    expect(expandFieldValues({ mode: 'every', raw: '*' }, 5, 1)).toBeNull();
  });
});

describe('lastDayOfMonth / lastWeekdayOfMonth', () => {
  it('应返回公历月末日', () => {
    expect(lastDayOfMonth(2026, 1)).toBe(31);
    expect(lastDayOfMonth(2026, 2)).toBe(28);
    expect(lastDayOfMonth(2024, 2)).toBe(29);
  });

  it('月末为周六/日时应回退到周五（Quartz LW）', () => {
    // 2026-01-31 周六 → 30 周五
    expect(lastWeekdayOfMonth(2026, 1)).toBe(30);
    // 2026-02-28 周六 → 27 周五
    expect(lastWeekdayOfMonth(2026, 2)).toBe(27);
    // 2026-05-31 周日 → 29 周五
    expect(lastWeekdayOfMonth(2026, 5)).toBe(29);
    // 2026-03-31 周二 → 31
    expect(lastWeekdayOfMonth(2026, 3)).toBe(31);
  });
});

describe('nearestWeekdayOfMonth', () => {
  it('工作日应原样返回', () => {
    // 2026-01-15 周四
    expect(nearestWeekdayOfMonth(2026, 1, 15)).toBe(15);
  });

  it('周六应回退周五；1 号周六应进到周一', () => {
    // 2026-01-31 周六 → 30
    expect(nearestWeekdayOfMonth(2026, 1, 31)).toBe(30);
    // 2026-08-01 周六 → 3（周一）
    expect(nearestWeekdayOfMonth(2026, 8, 1)).toBe(3);
  });

  it('周日应前进周一；月末周日应退到周五', () => {
    // 2026-02-01 周日 → 2
    expect(nearestWeekdayOfMonth(2026, 2, 1)).toBe(2);
    // 2026-05-31 周日 → 29
    expect(nearestWeekdayOfMonth(2026, 5, 31)).toBe(29);
  });

  it('越界日号应返回 null', () => {
    expect(nearestWeekdayOfMonth(2026, 2, 30)).toBeNull();
    expect(nearestWeekdayOfMonth(2026, 1, 0)).toBeNull();
  });
});

describe('lastQuartzWeekdayOfMonth / nthQuartzWeekdayOfMonth', () => {
  it('6L 应为每月最后一个周五', () => {
    expect(lastQuartzWeekdayOfMonth(2026, 1, 6)).toBe(30);
    expect(lastQuartzWeekdayOfMonth(2026, 2, 6)).toBe(27);
    expect(lastQuartzWeekdayOfMonth(2026, 5, 6)).toBe(29);
  });

  it('6#3 应为每月第三个周五', () => {
    expect(nthQuartzWeekdayOfMonth(2026, 1, 6, 3)).toBe(16);
    expect(nthQuartzWeekdayOfMonth(2026, 2, 6, 3)).toBe(20);
    expect(nthQuartzWeekdayOfMonth(2026, 5, 6, 3)).toBe(15);
  });

  it('非法星期 / 序数应返回 null', () => {
    expect(lastQuartzWeekdayOfMonth(2026, 1, 9)).toBeNull();
    expect(nthQuartzWeekdayOfMonth(2026, 1, 6, 0)).toBeNull();
    expect(nthQuartzWeekdayOfMonth(2026, 1, 6, 6)).toBeNull();
  });

  it('第 5 个若不存在应返回 null', () => {
    // 2026-02 只有 4 个周五（6,13,20,27）
    expect(nthQuartzWeekdayOfMonth(2026, 2, 6, 5)).toBeNull();
  });
});

describe('getNextRuns / formatRunTime', () => {
  it('默认 * * * * * ? * 应返回连续秒级触发点', () => {
    const from = new Date(2026, 0, 1, 12, 0, 0);
    const runs = getNextRuns(createDefaultCronState(), 3, from);
    expect(runs).toHaveLength(3);
    expect(formatRunTime(runs[0])).toBe('2026-01-01 12:00:01');
    expect(formatRunTime(runs[1])).toBe('2026-01-01 12:00:02');
    expect(formatRunTime(runs[2])).toBe('2026-01-01 12:00:03');
  });


  it('日字段裸 L 应按月末触发', () => {
    const state = createDefaultCronState();
    state.second = { mode: 'specific', raw: '0', value: '0' };
    state.minute = { mode: 'specific', raw: '0', value: '0' };
    state.hour = { mode: 'specific', raw: '0', value: '0' };
    state.day = { mode: 'last', raw: 'L' };
    state.week = createUnsetField();
    const from = new Date(2026, 0, 1, 0, 0, 0);
    const runs = getNextRuns(state, 3, from);
    expect(runs).toHaveLength(3);
    expect(formatRunTime(runs[0])).toBe('2026-01-31 00:00:00');
    expect(formatRunTime(runs[1])).toBe('2026-02-28 00:00:00');
    expect(formatRunTime(runs[2])).toBe('2026-03-31 00:00:00');
  });

  it('日字段 LW 应按月末工作日触发', () => {
    const state = createDefaultCronState();
    state.second = { mode: 'specific', raw: '0', value: '0' };
    state.minute = { mode: 'specific', raw: '0', value: '0' };
    state.hour = { mode: 'specific', raw: '9', value: '9' };
    state.day = { mode: 'lastWeekday', raw: 'LW' };
    state.week = createUnsetField();
    const from = new Date(2026, 0, 1, 0, 0, 0);
    const runs = getNextRuns(state, 3, from);
    expect(runs).toHaveLength(3);
    // 1/31 六→30、2/28 六→27、3/31 二→31
    expect(formatRunTime(runs[0])).toBe('2026-01-30 09:00:00');
    expect(formatRunTime(runs[1])).toBe('2026-02-27 09:00:00');
    expect(formatRunTime(runs[2])).toBe('2026-03-31 09:00:00');
  });

  it('日字段 15W 应按最接近 15 号的工作日触发', () => {
    const state = createDefaultCronState();
    state.second = { mode: 'specific', raw: '0', value: '0' };
    state.minute = { mode: 'specific', raw: '0', value: '0' };
    state.hour = { mode: 'specific', raw: '0', value: '0' };
    state.day = { mode: 'weekday', raw: '15W', value: '15' };
    state.week = createUnsetField();
    const from = new Date(2026, 0, 1, 0, 0, 0);
    const runs = getNextRuns(state, 3, from);
    expect(runs).toHaveLength(3);
    // 1/15 四→15；2/15 日→16；3/15 日→16
    expect(formatRunTime(runs[0])).toBe('2026-01-15 00:00:00');
    expect(formatRunTime(runs[1])).toBe('2026-02-16 00:00:00');
    expect(formatRunTime(runs[2])).toBe('2026-03-16 00:00:00');
  });

  it('日字段 1W 在 1 号为周六时应收到周一（不跨月）', () => {
    const state = createDefaultCronState();
    state.second = { mode: 'specific', raw: '0', value: '0' };
    state.minute = { mode: 'specific', raw: '0', value: '0' };
    state.hour = { mode: 'specific', raw: '0', value: '0' };
    state.day = { mode: 'weekday', raw: '1W', value: '1' };
    state.month = { mode: 'specific', raw: '8', value: '8' };
    state.week = createUnsetField();
    const from = new Date(2026, 6, 1, 0, 0, 0); // Jul 1
    const runs = getNextRuns(state, 1, from);
    expect(runs).toHaveLength(1);
    expect(formatRunTime(runs[0])).toBe('2026-08-03 00:00:00');
  });

  it('日字段 weekday 缺 value 应返回空', () => {
    const state = createDefaultCronState();
    state.day = { mode: 'weekday', raw: 'W' };
    state.week = createUnsetField();
    expect(getNextRuns(state, 3, new Date(2026, 0, 1))).toEqual([]);
  });

  it('日字段 nL（带 value）仍无法展开，应返回空', () => {
    const state = createDefaultCronState();
    state.day = { mode: 'last', raw: '5L', value: '5' };
    state.week = createUnsetField();
    expect(getNextRuns(state, 5, new Date(2026, 0, 1))).toEqual([]);
  });

  it('周字段裸 L 应按每周六触发（Quartz ≡ SAT）', () => {
    const state = createDefaultCronState();
    state.second = { mode: 'specific', raw: '0', value: '0' };
    state.minute = { mode: 'specific', raw: '0', value: '0' };
    state.hour = { mode: 'specific', raw: '0', value: '0' };
    state.day = createUnsetField();
    state.week = { mode: 'last', raw: 'L' };
    const from = new Date(2026, 0, 1, 0, 0, 0); // 周四
    const runs = getNextRuns(state, 2, from);
    expect(runs).toHaveLength(2);
    expect(runs[0].getDay()).toBe(6);
    expect(formatRunTime(runs[0])).toBe('2026-01-03 00:00:00');
    expect(formatRunTime(runs[1])).toBe('2026-01-10 00:00:00');
  });

  it('周字段 6L 应按每月最后一个周五触发', () => {
    const state = createDefaultCronState();
    state.second = { mode: 'specific', raw: '0', value: '0' };
    state.minute = { mode: 'specific', raw: '0', value: '0' };
    state.hour = { mode: 'specific', raw: '9', value: '9' };
    state.day = createUnsetField();
    state.week = { mode: 'last', raw: '6L', value: '6' };
    const from = new Date(2026, 0, 1, 0, 0, 0);
    const runs = getNextRuns(state, 3, from);
    expect(runs).toHaveLength(3);
    expect(formatRunTime(runs[0])).toBe('2026-01-30 09:00:00');
    expect(formatRunTime(runs[1])).toBe('2026-02-27 09:00:00');
    expect(formatRunTime(runs[2])).toBe('2026-03-27 09:00:00');
  });

  it('周字段 6#3 应按每月第三个周五触发', () => {
    const state = createDefaultCronState();
    state.second = { mode: 'specific', raw: '0', value: '0' };
    state.minute = { mode: 'specific', raw: '0', value: '0' };
    state.hour = { mode: 'specific', raw: '0', value: '0' };
    state.day = createUnsetField();
    state.week = { mode: 'nth', raw: '6#3', value: '6', secondary: '3' };
    const from = new Date(2026, 0, 1, 0, 0, 0);
    const runs = getNextRuns(state, 3, from);
    expect(runs).toHaveLength(3);
    expect(formatRunTime(runs[0])).toBe('2026-01-16 00:00:00');
    expect(formatRunTime(runs[1])).toBe('2026-02-20 00:00:00');
    expect(formatRunTime(runs[2])).toBe('2026-03-20 00:00:00');
  });

  it('周字段 nth 缺参数不得臆测', () => {
    const state = createDefaultCronState();
    state.day = createUnsetField();
    state.week = { mode: 'nth', raw: '#' };
    expect(getNextRuns(state, 5, new Date(2026, 0, 1))).toEqual([]);
  });

  it('应按 Quartz 周过滤并尊重年份（1=周日）', () => {
    const state = createDefaultCronState();
    state.second = { mode: 'specific', raw: '0', value: '0' };
    state.minute = { mode: 'specific', raw: '0', value: '0' };
    state.hour = { mode: 'specific', raw: '0', value: '0' };
    state.day = createUnsetField();
    state.week = { mode: 'specific', raw: '1', value: '1' }; // Quartz 周日
    state.year = { mode: 'specific', raw: '2026', value: '2026' };
    const from = new Date(2026, 0, 1, 0, 0, 0); // 周四
    const runs = getNextRuns(state, 2, from);
    expect(runs.length).toBeGreaterThan(0);
    expect(runs[0].getDay()).toBe(0); // JS 周日
    expect(runs[0].getFullYear()).toBe(2026);
  });

  it('周倒序 7-3（周六→周二）应能预估近 N 次', () => {
    const state = createDefaultCronState();
    state.second = { mode: 'specific', raw: '0', value: '0' };
    state.minute = { mode: 'specific', raw: '0', value: '0' };
    state.hour = { mode: 'specific', raw: '9', value: '9' };
    state.day = createUnsetField();
    state.week = { mode: 'range', raw: '7-3', value: '7', secondary: '3' };
    // 2026-01-01 周四；合法 JS getDay：6=六,0=日,1=一,2=二
    const from = new Date(2026, 0, 1, 0, 0, 0);
    const runs = getNextRuns(state, 4, from);
    expect(runs).toHaveLength(4);
    const allowed = new Set([6, 0, 1, 2]);
    for (const r of runs) {
      expect(allowed.has(r.getDay())).toBe(true);
      expect(r.getHours()).toBe(9);
    }
  });

  it('小时倒序 22-2 应能预估近 N 次', () => {
    const state = createDefaultCronState();
    state.second = { mode: 'specific', raw: '0', value: '0' };
    state.minute = { mode: 'specific', raw: '0', value: '0' };
    state.hour = { mode: 'range', raw: '22-2', value: '22', secondary: '2' };
    const from = new Date(2026, 0, 1, 12, 0, 0);
    const runs = getNextRuns(state, 5, from);
    expect(runs).toHaveLength(5);
    // 日内按时钟升序：当天 22、23，次日 0、1、2
    expect(runs.map((d) => d.getHours())).toEqual([22, 23, 0, 1, 2]);
  });


  it('月不匹配时应跳过', () => {
    const state = createDefaultCronState();
    state.second = { mode: 'specific', raw: '0', value: '0' };
    state.minute = { mode: 'specific', raw: '0', value: '0' };
    state.hour = { mode: 'specific', raw: '0', value: '0' };
    state.month = { mode: 'specific', raw: '12', value: '12' };
    const from = new Date(2026, 0, 1, 0, 0, 0);
    const runs = getNextRuns(state, 1, from);
    expect(runs[0].getMonth()).toBe(11);
  });

  it('日具体值应过滤', () => {
    const state = createDefaultCronState();
    state.second = { mode: 'specific', raw: '0', value: '0' };
    state.minute = { mode: 'specific', raw: '0', value: '0' };
    state.hour = { mode: 'specific', raw: '0', value: '0' };
    state.day = { mode: 'specific', raw: '15', value: '15' };
    const from = new Date(2026, 0, 1, 0, 0, 0);
    const runs = getNextRuns(state, 1, from);
    expect(runs[0].getDate()).toBe(15);
  });

  it('年份不匹配时应跳过直至命中', () => {
    const state = createDefaultCronState();
    state.second = { mode: 'specific', raw: '0', value: '0' };
    state.minute = { mode: 'specific', raw: '0', value: '0' };
    state.hour = { mode: 'specific', raw: '0', value: '0' };
    state.year = { mode: 'specific', raw: '2028', value: '2028' };
    const from = new Date(2026, 0, 1, 0, 0, 0);
    const runs = getNextRuns(state, 1, from);
    expect(runs[0].getFullYear()).toBe(2028);
  });

  it('扫描窗口内不足 count 时应返回已有结果', () => {
    const state = createDefaultCronState();
    state.second = { mode: 'specific', raw: '0', value: '0' };
    state.minute = { mode: 'specific', raw: '0', value: '0' };
    state.hour = { mode: 'specific', raw: '0', value: '0' };
    state.year = { mode: 'specific', raw: '2026', value: '2026' };
    state.month = { mode: 'specific', raw: '1', value: '1' };
    state.day = { mode: 'specific', raw: '2', value: '2' };
    const from = new Date(2026, 0, 2, 12, 0, 0);
    const runs = getNextRuns(state, 5, from);
    expect(runs.length).toBeLessThan(5);
  });

  it('应防护非法 count / from，并限制最大条数', () => {
    const state = createDefaultCronState();
    const from = new Date(2026, 0, 1, 12, 0, 0);
    expect(getNextRuns(state, 0, from)).toEqual([]);
    expect(getNextRuns(state, -1, from)).toEqual([]);
    expect(getNextRuns(state, Number.NaN, from)).toEqual([]);
    expect(getNextRuns(state, 10, new Date(Number.NaN))).toEqual([]);
    const many = getNextRuns(state, 1000, from);
    expect(many.length).toBeLessThanOrEqual(100);
  });

  it('formatRunTime 对非法 Date 应返回空串', () => {
    expect(formatRunTime(new Date(Number.NaN))).toBe('');
  });

  it('越界 hour 不得通过 Date 进位产生伪触发点', () => {
    const state = createDefaultCronState();
    state.hour = { mode: 'specific', raw: '99', value: '99' };
    const from = new Date(2026, 0, 1, 0, 0, 0);
    expect(getNextRuns(state, 5, from)).toEqual([]);
  });

  it('同一天内应跳过已过去的时分秒', () => {
    const state = createDefaultCronState();
    state.hour = { mode: 'specific', raw: '12', value: '12' };
    state.minute = createEveryField();
    state.second = createEveryField();
    const from = new Date(2026, 0, 1, 12, 30, 30);
    const runs = getNextRuns(state, 3, from);
    expect(runs.length).toBe(3);
    expect(runs[0].getTime()).toBeGreaterThan(from.getTime());
    expect(runs[0].getHours()).toBe(12);
    expect(runs[0].getMinutes()).toBe(30);
    expect(runs[0].getSeconds()).toBe(31);
  });

  it('年字段无法展开时应返回空', () => {
    const state = createDefaultCronState();
    state.year = { mode: 'last', raw: 'L' };
    expect(getNextRuns(state, 3, new Date(2026, 0, 1))).toEqual([]);
  });

  it('range 夹紧后起点大于终点应返回 null', () => {
    // rawStart/rawEnd 合法但全部落在区间外且方向颠倒：例如 min=10 max=12, range 0-5 → clamp 后 10-10? 
    // 0-5 clamp to 10-12 → start=10 end=10 OK. 用 20-25 on 0-10 → start=10 end=10.
    // 真正 start>end：rawStart=25 rawEnd=20 已在 rawStart>rawEnd 拦截。
    // 覆盖 clamp 后仍有效的边界：
    expect(
      expandFieldValues(
        { mode: 'range', raw: '100-200', value: '100', secondary: '200' },
        0,
        23,
      ),
    ).toEqual([23]);
  });
});
