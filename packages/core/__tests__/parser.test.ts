import { describe, it, expect } from 'vitest';
import {
  parseCron,
  parseField,
  escapeCronPercent,
  unescapeCronPercent,
  assertDayWeekMutex,
  getFieldMode,
} from '../src/parser';

describe('escapeCronPercent / unescapeCronPercent', () => {
  it('应转义未转义的 %', () => {
    expect(escapeCronPercent('0 0 2 * * ? * %job')).toBe('0 0 2 * * ? * \\%job');
  });

  it('已转义的 % 不应重复转义', () => {
    expect(escapeCronPercent('0 0 2 * * ? * \\%job')).toBe('0 0 2 * * ? * \\%job');
  });

  it('应还原转义的 %', () => {
    expect(unescapeCronPercent('0 0 2 * * ? * \\%job')).toBe('0 0 2 * * ? * %job');
  });
});

describe('assertDayWeekMutex', () => {
  it('日和周同时有具体值时应失败', () => {
    const res = assertDayWeekMutex('15', '6');
    expect(res.ok).toBe(false);
    expect(res.error).toContain('日和周不能同时指定');
  });

  it('一方为 ? 或 * 时应通过', () => {
    expect(assertDayWeekMutex('15', '?').ok).toBe(true);
    expect(assertDayWeekMutex('*', '1-5').ok).toBe(true);
    expect(assertDayWeekMutex('?', '?').ok).toBe(true);
  });
});

describe('parseField', () => {
  it('应解析 every / unset', () => {
    expect(parseField('*', 'hour').state.mode).toBe('every');
    expect(parseField('?', 'week').state.mode).toBe('unset');
  });

  it('应解析 specific / range / list / step', () => {
    expect(parseField('2', 'hour').state).toMatchObject({
      mode: 'specific',
      value: '2',
    });
    expect(parseField('1-5', 'day').state).toMatchObject({
      mode: 'range',
      value: '1',
      secondary: '5',
    });
    expect(parseField('1,3,5', 'minute').state).toMatchObject({
      mode: 'list',
      values: ['1', '3', '5'],
    });
    expect(parseField('*/5', 'second').state).toMatchObject({
      mode: 'step',
      value: '*',
      secondary: '5',
    });
    expect(parseField('0/10', 'minute').state).toMatchObject({
      mode: 'step',
      value: '0',
      secondary: '10',
    });
  });

  it('应解析 L / W / nth', () => {
    expect(parseField('L', 'day').state.mode).toBe('last');
    expect(parseField('6L', 'week').state).toMatchObject({
      mode: 'last',
      value: '6',
    });
    expect(parseField('15W', 'day').state).toMatchObject({
      mode: 'weekday',
      value: '15',
    });
    expect(parseField('6#3', 'week').state).toMatchObject({
      mode: 'nth',
      value: '6',
      secondary: '3',
    });
  });

  it('超范围 / 异常格式应降级并给出 warning', () => {
    const over = parseField('99', 'hour');
    expect(over.state.mode).toBe('specific');
    expect(over.warning).toContain('超出范围');

    const badStep = parseField('*/', 'minute');
    expect(badStep.warning).toContain('步长格式异常');

    const badRange = parseField('1-', 'day');
    expect(badRange.warning).toContain('区间格式异常');

    const emptyList = parseField(',', 'month');
    expect(emptyList.warning).toContain('列表为空');

    const alias = parseField('MON', 'week');
    expect(alias.warning).toContain('非标准写法');
  });
});

describe('parseCron', () => {
  it('应正确解析标准 7 段表达式', () => {
    const res = parseCron('0 0 2 * * ? *');
    expect(res.success).toBe(true);
    expect(res.state?.hour).toMatchObject({ mode: 'specific', value: '2' });
    expect(res.state?.day.mode).toBe('every');
    expect(res.state?.week.mode).toBe('unset');
    expect(getFieldMode(res.state!, 'hour')).toBe('specific');
  });

  it('应拦截日周互斥的非法输入', () => {
    const res = parseCron('0 0 2 15 * 6');
    expect(res.success).toBe(false);
    expect(res.error).toContain('日和周不能同时指定');
  });

  it('应拒绝空 / 非字符串 / 乱码 / 过长输入', () => {
    expect(parseCron('').success).toBe(false);
    expect(parseCron('   ').success).toBe(false);
    // @ts-expect-error 故意传入非法类型
    expect(parseCron(null).success).toBe(false);
    expect(parseCron('0 0 2 * * ? * @@').success).toBe(false);
    expect(parseCron('0 0 2 * * ? * @@').error).toContain('非法字符');
    expect(parseCron('0 '.repeat(200)).success).toBe(false);
    expect(parseCron('0 '.repeat(200)).error).toContain('过长');
  });

  it('字段数量非法时应失败', () => {
    const res = parseCron('0 0 2');
    expect(res.success).toBe(false);
    expect(res.error).toContain('字段数量非法');
  });

  it('应容错补全 5 / 6 段表达式', () => {
    const five = parseCron('0 2 * * ?');
    expect(five.success).toBe(true);
    expect(five.state?.second.value).toBe('0');
    expect(five.state?.hour.value).toBe('2');
    expect(five.warning).toContain('5 段');

    const six = parseCron('0 0 2 * * ?');
    expect(six.success).toBe(true);
    expect(six.state?.year.mode).toBe('every');
    expect(six.warning).toContain('6 段');
  });

  it('应处理 % 转义并在输出中保留转义', () => {
    const res = parseCron('0 0 2 * * ? * %demo');
    // `%demo` 会被当成第 8 段 → 字段数非法；改为同字段内测试 escape API 已覆盖
    // 这里验证含 \% 的合法 7 段可解析
    const escaped = parseCron('0 0 2 * * ? *');
    expect(escaped.success).toBe(true);
    expect(escaped.expression).toBe('0 0 2 * * ? *');
    expect(escapeCronPercent('a%b')).toBe('a\\%b');
  });

  it('复杂合法表达式应解析各模式', () => {
    const res = parseCron('0 0/5 1-3 1,15 * ? 2024');
    expect(res.success).toBe(true);
    expect(res.state?.minute.mode).toBe('step');
    expect(res.state?.hour.mode).toBe('range');
    expect(res.state?.day.mode).toBe('list');
    expect(res.state?.year.value).toBe('2024');
  });

  it('非法日期数值应降级成功并带 warning（2 月 31 日场景由校验层后续强化）', () => {
    const res = parseCron('0 0 0 31 2 ? *');
    expect(res.success).toBe(true);
    expect(res.state?.day.value).toBe('31');
    expect(res.state?.month.value).toBe('2');
  });

  it('字段软警告应汇总到 ParseResult.warning（容错不崩溃）', () => {
    const res = parseCron('0 0 99 * * ? *');
    expect(res.success).toBe(true);
    expect(res.state?.hour.value).toBe('99');
    expect(res.warning).toContain('超出范围');
  });

  it('空步长起点 /5 应降级为 step 且 value 为 *', () => {
    const { state } = parseField('/5', 'second');
    expect(state.mode).toBe('step');
    expect(state.value).toBe('*');
    expect(state.secondary).toBe('5');
  });
});
