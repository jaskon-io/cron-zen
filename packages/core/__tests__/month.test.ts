import { describe, it, expect } from 'vitest';
import {
  QUARTZ_MONTH_LABELS,
  QUARTZ_MONTH_ABBR,
  quartzMonthLabel,
  monthNumberToAbbr,
  monthAbbrToNumber,
} from '../src/month';

describe('month helpers', () => {
  it('应覆盖 1-12 中英文标签', () => {
    expect(Object.keys(QUARTZ_MONTH_LABELS)).toHaveLength(12);
    expect(Object.keys(QUARTZ_MONTH_ABBR)).toHaveLength(12);
    expect(QUARTZ_MONTH_LABELS[1]).toBe('1月');
    expect(QUARTZ_MONTH_ABBR[12]).toBe('DEC');
  });

  it('quartzMonthLabel / monthNumberToAbbr 应映射合法月', () => {
    expect(quartzMonthLabel(3)).toBe('3月');
    expect(quartzMonthLabel('10')).toBe('10月');
    expect(monthNumberToAbbr(1)).toBe('JAN');
    expect(monthNumberToAbbr('7')).toBe('JUL');
  });

  it('非法值应回退原字符串', () => {
    expect(quartzMonthLabel(99)).toBe('99');
    expect(monthNumberToAbbr('x')).toBe('x');
  });

  it('monthAbbrToNumber 应识别大小写缩写', () => {
    expect(monthAbbrToNumber('JAN')).toBe(1);
    expect(monthAbbrToNumber('feb')).toBe(2);
    expect(monthAbbrToNumber(' XYZ ')).toBeNull();
  });
});
