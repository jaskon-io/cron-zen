/**
 * @description 性能压测：死循环防护、内存上限、耗时阈值
 */
import { describe, it, expect } from 'vitest';
import {
  parseCron,
  generateCron,
  getNextRuns,
  createDefaultCronState,
  expandFieldValues,
  createEveryField,
  createUnsetField,
} from '../src/index';

describe('getNextRuns 性能', () => {
  it('全 * 默认态 100 次应 < 50ms（秒级快路径）', () => {
    const state = createDefaultCronState();
    const from = new Date(2026, 5, 15, 12, 0, 0);
    const t0 = performance.now();
    const runs = getNextRuns(state, 100, from);
    const ms = performance.now() - t0;
    expect(runs).toHaveLength(100);
    expect(runs[0].getTime()).toBe(from.getTime() + 1000);
    expect(ms).toBeLessThan(50);
  });

  it('稀疏字段（仅某年某月）应能跳年跳月且 < 200ms', () => {
    const state = createDefaultCronState();
    state.second = { mode: 'specific', raw: '0', value: '0' };
    state.minute = { mode: 'specific', raw: '0', value: '0' };
    state.hour = { mode: 'specific', raw: '0', value: '0' };
    state.month = { mode: 'specific', raw: '12', value: '12' };
    state.year = { mode: 'specific', raw: '2030', value: '2030' };
    const from = new Date(2026, 0, 1, 0, 0, 0);
    const t0 = performance.now();
    const runs = getNextRuns(state, 5, from);
    const ms = performance.now() - t0;
    expect(runs.length).toBeGreaterThan(0);
    expect(runs[0].getFullYear()).toBe(2030);
    expect(runs[0].getMonth()).toBe(11);
    expect(ms).toBeLessThan(200);
  });

  it('连续调用 200 次不应内存膨胀或抛错', () => {
    const state = createDefaultCronState();
    const from = new Date(2026, 0, 1);
    for (let i = 0; i < 200; i++) {
      const runs = getNextRuns(state, 10, from);
      expect(runs).toHaveLength(10);
    }
  });

  it('step=超大时不死循环且结果有限', () => {
    const out = expandFieldValues(
      { mode: 'step', raw: '0/999999', value: '0', secondary: '999999' },
      0,
      59,
    );
    expect(out).not.toBeNull();
    expect(out!.length).toBeLessThanOrEqual(60);
  });
});

describe('expandFieldValues 内存上限', () => {
  it('跨度过大应返回 null 而非分配巨数组', () => {
    expect(expandFieldValues(createEveryField(), 0, 100_000)).toBeNull();
  });

  it('恶意 range 999999 应被夹紧到字段区间', () => {
    const out = expandFieldValues(
      { mode: 'range', raw: '0-999999', value: '0', secondary: '999999' },
      0,
      59,
    );
    expect(out).toEqual(Array.from({ length: 60 }, (_, i) => i));
  });

  it('list 超长应截断后仍可展开', () => {
    const values = Array.from({ length: 500 }, (_, i) => String(i));
    const out = expandFieldValues(
      { mode: 'list', raw: values.join(','), values },
      0,
      59,
    );
    expect(out).not.toBeNull();
    expect(out!.length).toBeLessThanOrEqual(60);
  });
});

describe('parse / generate 吞吐', () => {
  it('parseCron 1000 次 < 500ms', () => {
    const expr = '0 0/5 9-18 ? * 2-6 *';
    const t0 = performance.now();
    for (let i = 0; i < 1000; i++) {
      expect(parseCron(expr).success).toBe(true);
    }
    expect(performance.now() - t0).toBeLessThan(500);
  });

  it('generateCron 1000 次 < 500ms', () => {
    const state = createDefaultCronState();
    state.day = createUnsetField();
    state.week = { mode: 'range', raw: '2-6', value: '2', secondary: '6' };
    const t0 = performance.now();
    for (let i = 0; i < 1000; i++) {
      expect(generateCron(state).success).toBe(true);
    }
    expect(performance.now() - t0).toBeLessThan(500);
  });
});
