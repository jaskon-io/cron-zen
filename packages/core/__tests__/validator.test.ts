import { describe, it, expect } from 'vitest';
import {
  createDefaultCronState,
  createEveryField,
  createUnsetField,
} from '../src/types';
import {
  validateCronState,
  validateFieldRange,
  validateDayMonthCombo,
  validateDayWeekMutex,
  enforceDayWeekMutex,
  isConcreteField,
  getDaysInMonth,
  extractNumericValues,
} from '../src/validator';

describe('getDaysInMonth', () => {
  it('应返回正确天数并处理闰年', () => {
    expect(getDaysInMonth(1)).toBe(31);
    expect(getDaysInMonth(4)).toBe(30);
    expect(getDaysInMonth(2, 2024)).toBe(29);
    expect(getDaysInMonth(2, 2023)).toBe(28);
  });

  it('非法月份应返回 0', () => {
    expect(getDaysInMonth(0)).toBe(0);
    expect(getDaysInMonth(13)).toBe(0);
    expect(getDaysInMonth(1.5)).toBe(0);
  });
});

describe('isConcreteField / extractNumericValues', () => {
  it('every / unset 不应视为具体字段', () => {
    expect(isConcreteField(createEveryField())).toBe(false);
    expect(isConcreteField(createUnsetField())).toBe(false);
    expect(isConcreteField({ mode: 'specific', raw: '1', value: '1' })).toBe(true);
  });

  it('应提取 specific / range / list / step 数值', () => {
    expect(extractNumericValues({ mode: 'specific', raw: '3', value: '3' })).toEqual([3]);
    expect(
      extractNumericValues({ mode: 'range', raw: '1-5', value: '1', secondary: '5' }),
    ).toEqual([1, 5]);
    expect(
      extractNumericValues({
        mode: 'list',
        raw: '1,15',
        values: ['1', '15'],
      }),
    ).toEqual([1, 15]);
    expect(
      extractNumericValues({ mode: 'step', raw: '0/5', value: '0', secondary: '5' }),
    ).toEqual([0, 5]);
    expect(
      extractNumericValues({ mode: 'step', raw: '1-10/2', value: '1-10', secondary: '2' }),
    ).toEqual([2, 1, 10]);
    expect(extractNumericValues({ mode: 'every', raw: '*' })).toEqual([]);
    expect(extractNumericValues({ mode: 'last', raw: 'L' })).toEqual([]);
    expect(extractNumericValues({ mode: 'specific', raw: 'MON', value: 'MON' })).toEqual([]);
    expect(
      extractNumericValues({ mode: 'range', raw: 'a-b', value: 'a', secondary: 'b' }),
    ).toEqual([]);
    expect(extractNumericValues({ mode: 'list', raw: 'x,y', value: 'x,y' })).toEqual([]);
    expect(extractNumericValues({ mode: 'unknown' as never, raw: 'z' })).toEqual([]);
    expect(
      extractNumericValues({
        mode: 'step',
        raw: '1-/2',
        value: '1-',
        secondary: '2',
      }),
    ).toEqual([2, 1]);
    expect(
      extractNumericValues({
        mode: 'step',
        raw: '*/5',
        value: '*',
        secondary: '5',
      }),
    ).toEqual([5]);
    expect(
      extractNumericValues({
        mode: 'step',
        raw: '-5/2',
        value: '-5',
        secondary: '2',
      }),
    ).toEqual([2, 5]);
    expect(extractNumericValues({ mode: 'list', raw: '' })).toEqual([]);
  });
});

describe('validateFieldRange', () => {
  it('应拦截超范围与非法区间', () => {
    expect(
      validateFieldRange('hour', { mode: 'specific', raw: '25', value: '25' })[0],
    ).toContain('超出范围');
    expect(
      validateFieldRange('minute', {
        mode: 'range',
        raw: '10-5',
        value: '10',
        secondary: '5',
      })[0],
    ).toContain('起点不能大于终点');
    expect(
      validateFieldRange('second', {
        mode: 'step',
        raw: '0/0',
        value: '0',
        secondary: '0',
      })[0],
    ).toContain('步长');
  });

  it('应校验 nth / weekday', () => {
    expect(
      validateFieldRange('week', {
        mode: 'nth',
        raw: '8#3',
        value: '8',
        secondary: '3',
      })[0],
    ).toContain('星期值非法');
    expect(
      validateFieldRange('week', {
        mode: 'nth',
        raw: '6#6',
        value: '6',
        secondary: '6',
      })[0],
    ).toContain('序数非法');
    expect(
      validateFieldRange('day', {
        mode: 'weekday',
        raw: '40W',
        value: '40',
      })[0],
    ).toContain('W 值非法');
    // value / secondary 缺省 → NaN 分支，不报错
    expect(
      validateFieldRange('week', { mode: 'nth', raw: '#' }),
    ).toEqual([]);
    expect(
      validateFieldRange('day', { mode: 'weekday', raw: 'W' }),
    ).toEqual([]);
    // 合法步长不报错
    expect(
      validateFieldRange('minute', {
        mode: 'step',
        raw: '0/5',
        value: '0',
        secondary: '5',
      }),
    ).toEqual([]);
  });
});

describe('validateDayMonthCombo', () => {
  it('应拦截 2 月 31 日（未锁定年份）', () => {
    const res = validateDayMonthCombo(
      { mode: 'specific', raw: '31', value: '31' },
      { mode: 'specific', raw: '2', value: '2' },
    );
    expect(res.errors[0]).toContain('2月没有31日');
  });

  it('锁定年份后应拦截非闰年 2 月 29 / 任意年 2 月 31', () => {
    const nonLeap = validateDayMonthCombo(
      { mode: 'specific', raw: '29', value: '29' },
      { mode: 'specific', raw: '2', value: '2' },
      { mode: 'specific', raw: '2023', value: '2023' },
    );
    expect(nonLeap.errors[0]).toContain('2月没有29日');

    const d31 = validateDayMonthCombo(
      { mode: 'specific', raw: '31', value: '31' },
      { mode: 'specific', raw: '2', value: '2' },
      { mode: 'specific', raw: '2024', value: '2024' },
    );
    expect(d31.errors[0]).toContain('2月没有31日');
  });

  it('月为 * 时对 31 / 30 / 29 给出警告', () => {
    const d31 = validateDayMonthCombo(
      { mode: 'specific', raw: '31', value: '31' },
      createEveryField(),
    );
    expect(d31.warnings[0]).toContain('31');
    const d30 = validateDayMonthCombo(
      { mode: 'specific', raw: '30', value: '30' },
      createEveryField(),
    );
    expect(d30.warnings[0]).toContain('30');
    const d29 = validateDayMonthCombo(
      { mode: 'specific', raw: '29', value: '29' },
      createEveryField(),
    );
    expect(d29.warnings[0]).toContain('29');
  });

  it('未锁定年份的 2 月 29 应给出闰年警告', () => {
    const res = validateDayMonthCombo(
      { mode: 'specific', raw: '29', value: '29' },
      { mode: 'specific', raw: '2', value: '2' },
    );
    expect(res.errors).toHaveLength(0);
    expect(res.warnings.some((w) => w.includes('闰年'))).toBe(true);
  });

  it('合法日期应通过', () => {
    const res = validateDayMonthCombo(
      { mode: 'specific', raw: '29', value: '29' },
      { mode: 'specific', raw: '2', value: '2' },
      { mode: 'specific', raw: '2024', value: '2024' },
    );
    expect(res.errors).toHaveLength(0);
  });
});

describe('validateDayWeekMutex / enforceDayWeekMutex', () => {
  it('日周同时具体应失败', () => {
    const state = createDefaultCronState();
    state.day = { mode: 'specific', raw: '15', value: '15' };
    state.week = { mode: 'specific', raw: '6', value: '6' };
    const res = validateDayWeekMutex(state);
    expect(res.ok).toBe(false);
    expect(res.error).toContain('日和周不能同时指定');
  });

  it('应自动将冲突的周锁定为 ?', () => {
    const state = createDefaultCronState();
    state.day = { mode: 'specific', raw: '15', value: '15' };
    state.week = { mode: 'specific', raw: '6', value: '6' };
    const { state: next, changed, warning } = enforceDayWeekMutex(state);
    expect(changed).toBe(true);
    expect(next.week.mode).toBe('unset');
    expect(warning).toContain('周字段设为');
  });

  it('配置日时 every 周应变为 ?；配置周时 every 日应变为 ?', () => {
    const withDay = createDefaultCronState();
    withDay.day = { mode: 'specific', raw: '1', value: '1' };
    withDay.week = createEveryField();
    expect(enforceDayWeekMutex(withDay).state.week.mode).toBe('unset');

    const withWeek = createDefaultCronState();
    withWeek.day = createEveryField();
    withWeek.week = { mode: 'specific', raw: '1', value: '1' };
    expect(enforceDayWeekMutex(withWeek).state.day.mode).toBe('unset');
  });

  it('双方 every / unset 应按惯例规范化', () => {
    const bothEvery = createDefaultCronState();
    bothEvery.day = createEveryField();
    bothEvery.week = createEveryField();
    expect(enforceDayWeekMutex(bothEvery).state.week.mode).toBe('unset');

    const bothUnset = createDefaultCronState();
    bothUnset.day = createUnsetField();
    bothUnset.week = createUnsetField();
    expect(enforceDayWeekMutex(bothUnset).state.day.mode).toBe('every');
  });

  it('已合法状态不应被修改', () => {
    const state = createDefaultCronState();
    const res = enforceDayWeekMutex(state);
    expect(res.changed).toBe(false);
  });
});

describe('validateCronState', () => {
  it('默认状态应通过', () => {
    const res = validateCronState(createDefaultCronState());
    expect(res.valid).toBe(true);
    expect(res.errors).toHaveLength(0);
  });

  it('无效对象 / 缺字段应失败', () => {
    // @ts-expect-error 故意传入非法类型
    expect(validateCronState(null).valid).toBe(false);
    // @ts-expect-error 故意传入残缺对象
    expect(validateCronState({ second: { mode: 'specific', raw: '0' } }).errors[0]).toContain(
      '缺少或无效的字段',
    );
  });

  it('应汇总范围错误与非法日期', () => {
    const state = createDefaultCronState();
    state.hour = { mode: 'specific', raw: '99', value: '99' };
    state.day = { mode: 'specific', raw: '31', value: '31' };
    state.month = { mode: 'specific', raw: '2', value: '2' };
    const res = validateCronState(state);
    expect(res.valid).toBe(false);
    expect(res.errors.some((e) => e.includes('超出范围'))).toBe(true);
    expect(res.errors.some((e) => e.includes('2月没有31日'))).toBe(true);
  });
});
