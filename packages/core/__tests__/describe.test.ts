import { describe, it, expect } from 'vitest';
import {
  createDefaultCronState,
  createEveryField,
  createUnsetField,
} from '../src/types';
import { describeCron, describeField } from '../src/describe';

describe('describeField', () => {
  it('应覆盖各模式', () => {
    expect(describeField('时', { mode: 'every', raw: '*' })).toBe('');
    expect(describeField('时', { mode: 'unset', raw: '?' })).toBe('');
    expect(describeField('时', { mode: 'specific', raw: '2', value: '2' })).toContain('2');
    expect(
      describeField('分', { mode: 'range', raw: '1-5', value: '1', secondary: '5' }),
    ).toContain('1-5');
    expect(
      describeField('秒', { mode: 'step', raw: '0/5', value: '0', secondary: '5' }),
    ).toContain('每 5');
    expect(
      describeField('日', { mode: 'list', raw: '1,15', values: ['1', '15'] }),
    ).toContain('1、15');
    expect(describeField('日', { mode: 'last', raw: 'L' })).toBe('最后一天');
    // Quartz：6 = 周五
    expect(describeField('周', { mode: 'last', raw: '6L', value: '6' })).toContain('星期五');
    expect(describeField('日', { mode: 'weekday', raw: '15W', value: '15' })).toContain('15');
    expect(
      describeField('周', { mode: 'nth', raw: '6#3', value: '6', secondary: '3' }),
    ).toContain('第 3');
    expect(
      describeField('周', { mode: 'nth', raw: '6#3', value: '6', secondary: '3' }),
    ).toContain('星期五');
    expect(describeField('月', { mode: 'unknown' as never, raw: 'X' })).toBe('X');
    expect(
      describeField('秒', { mode: 'step', raw: '*/1', value: '', secondary: undefined }),
    ).toContain('*');
    expect(describeField('日', { mode: 'list', raw: '2', value: '2' })).toContain('2');
  });
});

describe('describeCron', () => {
  it('默认状态应描述为每天 0 点', () => {
    const text = describeCron(createDefaultCronState());
    expect(text).toContain('每天');
    expect(text).toContain('0 时');
  });

  it('应描述周模式与复杂时间', () => {
    const state = createDefaultCronState();
    state.day = createUnsetField();
    state.week = { mode: 'range', raw: '1-5', value: '1', secondary: '5' };
    state.hour = { mode: 'step', raw: '0/2', value: '0', secondary: '2' };
    state.minute = createEveryField();
    state.second = createEveryField();
    state.year = { mode: 'specific', raw: '2026', value: '2026' };
    state.month = { mode: 'list', raw: '1,6', values: ['1', '6'] };
    const text = describeCron(state);
    expect(text).toContain('2026');
    expect(text).toContain('周');
  });

  it('日具体时应走日描述分支', () => {
    const state = createDefaultCronState();
    state.day = { mode: 'specific', raw: '15', value: '15' };
    expect(describeCron(state)).toContain('15');
  });

  it('年字段非 every/specific 时应追加年描述', () => {
    const state = createDefaultCronState();
    state.year = { mode: 'range', raw: '2026-2030', value: '2026', secondary: '2030' };
    expect(describeCron(state)).toContain('年');
  });

  it('年字段 list 空描述时不应追加', () => {
    const state = createDefaultCronState();
    state.year = { mode: 'unset', raw: '?' };
    expect(describeCron(state)).toContain('每天');
  });

  it('应覆盖 specific 仅 raw、list 走 value、以及非 specific 时间字段', () => {
    expect(
      describeField('时', { mode: 'specific', raw: '8' }),
    ).toContain('8');
    expect(
      describeField('日', { mode: 'list', raw: '1,2', value: '1,2' }),
    ).toContain('1、2');
    expect(
      describeField('周', { mode: 'last', raw: 'xL', value: 'abc' }),
    ).toContain('abc');
    expect(
      describeField('周', {
        mode: 'nth',
        raw: 'x#1',
        value: 'abc',
        secondary: '1',
      }),
    ).toContain('abc');
    // values 优先于 value
    expect(
      describeField('日', {
        mode: 'list',
        raw: '9',
        value: '1,2',
        values: ['9'],
      }),
    ).toContain('9');
    // value 缺失时走空数组分支
    expect(describeField('日', { mode: 'list', raw: '' })).toBe('');

    const state = createDefaultCronState();
    state.hour = { mode: 'range', raw: '1-3', value: '1', secondary: '3' };
    state.minute = { mode: 'step', raw: '0/5', value: '0', secondary: '5' };
    state.second = { mode: 'list', raw: '0,30', values: ['0', '30'] };
    const text = describeCron(state);
    expect(text).toContain('小时');
    expect(text).toContain('分');
    expect(text).toContain('秒');
  });

  it('空日列表且无周时应回退为自定义调度', () => {
    const state = createDefaultCronState();
    state.day = { mode: 'list', raw: '', values: [] };
    state.week = createUnsetField();
    state.hour = createEveryField();
    state.minute = createEveryField();
    state.second = createEveryField();
    expect(describeCron(state)).toBe('自定义调度');
  });
});
