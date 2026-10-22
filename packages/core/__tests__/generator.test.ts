import { describe, it, expect } from 'vitest';
import {
  createDefaultCronState,
  createEveryField,
  createUnsetField,
} from '../src/types';
import { generateCron, generateCronOrThrow, stringifyField } from '../src/generator';
import { parseCron } from '../src/parser';

describe('stringifyField', () => {
  it('应序列化各模式', () => {
    expect(stringifyField({ mode: 'every', raw: '*' })).toBe('*');
    expect(stringifyField({ mode: 'unset', raw: '?' })).toBe('?');
    expect(stringifyField({ mode: 'specific', raw: '2', value: '2' })).toBe('2');
    expect(
      stringifyField({ mode: 'range', raw: '1-5', value: '1', secondary: '5' }),
    ).toBe('1-5');
    expect(
      stringifyField({ mode: 'step', raw: '0/5', value: '0', secondary: '5' }),
    ).toBe('0/5');
    expect(stringifyField({ mode: 'step', raw: '*/5', value: '', secondary: '5' })).toBe(
      '*/5',
    );
    expect(
      stringifyField({ mode: 'list', raw: '1,3', values: ['1', '3'] }),
    ).toBe('1,3');
    expect(stringifyField({ mode: 'list', raw: '1,3', value: '1,3' })).toBe('1,3');
    expect(stringifyField({ mode: 'last', raw: 'L' })).toBe('L');
    expect(stringifyField({ mode: 'last', raw: '6L', value: '6' })).toBe('6L');
    expect(stringifyField({ mode: 'weekday', raw: '15W', value: '15' })).toBe('15W');
    expect(
      stringifyField({ mode: 'nth', raw: '6#3', value: '6', secondary: '3' }),
    ).toBe('6#3');
  });

  it('缺省值应有安全回退', () => {
    expect(stringifyField({ mode: 'specific', raw: '' })).toBe('0');
    expect(stringifyField({ mode: 'list', raw: '' })).toBe('*');
    expect(stringifyField({ mode: 'weekday', raw: 'W' })).toBe('1W');
    expect(stringifyField({ mode: 'nth', raw: '#' })).toBe('1#1');
    expect(stringifyField({ mode: 'range', raw: '-' })).toBe('0-0');
    expect(stringifyField({ mode: 'step', raw: '/' })).toBe('*/1');
    // 未知 mode 走 default
    expect(
      stringifyField({ mode: 'unknown' as never, raw: 'X' }),
    ).toBe('X');
    expect(
      stringifyField({ mode: 'unknown' as never, raw: '' }),
    ).toBe('*');
  });
});

describe('generateCron', () => {
  it('默认状态应生成每天 0 点表达式', () => {
    const res = generateCron(createDefaultCronState());
    expect(res.success).toBe(true);
    expect(res.expression).toBe('0 0 0 * * ? *');
  });

  it('应与 parseCron 往返一致（标准表达式）', () => {
    const parsed = parseCron('0 0/5 1-3 1,15 * ? 2024');
    expect(parsed.success).toBe(true);
    const gen = generateCron(parsed.state!);
    expect(gen.success).toBe(true);
    expect(gen.expression).toBe('0 0/5 1-3 1,15 * ? 2024');
  });

  it('日周冲突时应自动修正并给出 warning', () => {
    const state = createDefaultCronState();
    state.day = { mode: 'specific', raw: '15', value: '15' };
    state.week = { mode: 'specific', raw: '6', value: '6' };
    const res = generateCron(state);
    expect(res.success).toBe(true);
    expect(res.expression).toBe('0 0 0 15 * ? *');
    expect(res.warning).toContain('周字段锁定');
  });

  it('enforceMutex=false 时日周冲突应失败', () => {
    const state = createDefaultCronState();
    state.day = { mode: 'specific', raw: '15', value: '15' };
    state.week = { mode: 'specific', raw: '6', value: '6' };
    const res = generateCron(state, { enforceMutex: false });
    expect(res.success).toBe(false);
    expect(res.error).toContain('日和周不能同时指定');
  });

  it('非法日期应生成失败', () => {
    const state = createDefaultCronState();
    state.day = { mode: 'specific', raw: '31', value: '31' };
    state.month = { mode: 'specific', raw: '2', value: '2' };
    const res = generateCron(state);
    expect(res.success).toBe(false);
    expect(res.error).toContain('2月没有31日');
  });

  it('无效 state 应失败', () => {
    // @ts-expect-error 故意传入非法类型
    const res = generateCron(null);
    expect(res.success).toBe(false);
    expect(res.error).toContain('无效');
  });

  it('复杂模式（L / W / nth）应正确生成', () => {
    const state = createDefaultCronState();
    state.day = { mode: 'last', raw: 'L' };
    state.week = createUnsetField();
    expect(generateCron(state).expression).toBe('0 0 0 L * ? *');

    const weekState = createDefaultCronState();
    weekState.day = createUnsetField();
    weekState.week = { mode: 'nth', raw: '6#3', value: '6', secondary: '3' };
    expect(generateCron(weekState).expression).toBe('0 0 0 ? * 6#3 *');

    const wState = createDefaultCronState();
    wState.day = { mode: 'weekday', raw: '15W', value: '15' };
    expect(generateCron(wState).expression).toBe('0 0 0 15W * ? *');
  });

  it('月为 * 且日为 31 时应成功并带 warning', () => {
    const state = createDefaultCronState();
    state.day = { mode: 'specific', raw: '31', value: '31' };
    const res = generateCron(state);
    expect(res.success).toBe(true);
    expect(res.expression).toBe('0 0 0 31 * ? *');
    expect(res.warning).toContain('31');
  });

  it('escapePercent=false 时应跳过转义', () => {
    const state = createDefaultCronState();
    const res = generateCron(state, { escapePercent: false });
    expect(res.success).toBe(true);
    expect(res.expression).toBe('0 0 0 * * ? *');
  });

  it('校验失败且含警告时应一并返回', () => {
    const state = createDefaultCronState();
    state.day = { mode: 'specific', raw: '31', value: '31' };
    state.month = createEveryField();
    state.hour = { mode: 'specific', raw: '99', value: '99' };
    const res = generateCron(state, { enforceMutex: false });
    expect(res.success).toBe(false);
    expect(res.error).toContain('超出范围');
    expect(res.warning).toContain('31');
  });
});

describe('generateCronOrThrow', () => {
  it('成功时应返回字符串', () => {
    expect(generateCronOrThrow(createDefaultCronState())).toBe('0 0 0 * * ? *');
  });

  it('失败时应抛出', () => {
    const state = createDefaultCronState();
    state.hour = { mode: 'specific', raw: '99', value: '99' };
    expect(() => generateCronOrThrow(state)).toThrow(/超出范围/);
  });
});
