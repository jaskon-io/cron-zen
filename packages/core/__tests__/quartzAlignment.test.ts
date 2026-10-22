import { describe, it, expect } from 'vitest';
import {
  createDefaultCronState,
  createUnsetField,
  parseCron,
  generateCron,
  getNextRuns,
  expandFieldValues,
  describeField,
  validateCronState,
  matchesQuartzWeek,
  isYearLikeToken,
  quartzWeekShortLabel,
  normalizeWeekFieldToken,
  stringifyField,
  parseField,
  weekAbbrToNumber,
  weekNumberToAbbr,
  QUARTZ_WEEK_LABELS,
  enforceDayWeekMutex,
} from '../src';

/**
 * 对齐 https://www.cron.ren/index.html / Quartz 语义的回归用例
 */
describe('Quartz / cron.ren 对齐', () => {
  describe('周字段（1=周日）', () => {
    it('matchesQuartzWeek：JS 周日应对齐 Quartz 0/1', () => {
      expect(matchesQuartzWeek(0, [1])).toBe(true);
      expect(matchesQuartzWeek(0, [0])).toBe(true);
      expect(matchesQuartzWeek(1, [1])).toBe(false);
      expect(matchesQuartzWeek(1, [2])).toBe(true);
      expect(matchesQuartzWeek(5, [6])).toBe(true); // 周五
      expect(matchesQuartzWeek(6, [7])).toBe(true); // 周六
    });

    it('UI 标签：1=星期天，2=星期一，6=星期五', () => {
      expect(QUARTZ_WEEK_LABELS[1]).toBe('星期天');
      expect(QUARTZ_WEEK_LABELS[2]).toBe('星期一');
      expect(QUARTZ_WEEK_LABELS[6]).toBe('星期五');
      expect(QUARTZ_WEEK_LABELS[7]).toBe('星期六');
    });

    it('parse + getNextRuns：0 0 0 ? * 1 * 应落在周日', () => {
      const parsed = parseCron('0 0 0 ? * 1 *');
      expect(parsed.success).toBe(true);
      const from = new Date(2026, 0, 1, 0, 0, 0); // 周四
      const runs = getNextRuns(parsed.state!, 1, from);
      expect(runs[0].getDay()).toBe(0);
    });

    it('parse + getNextRuns：周=2 应落在周一', () => {
      const parsed = parseCron('0 0 0 ? * 2 *');
      expect(parsed.success).toBe(true);
      const from = new Date(2026, 0, 1, 0, 0, 0);
      const runs = getNextRuns(parsed.state!, 1, from);
      expect(runs[0].getDay()).toBe(1);
    });

    it('describe：6L / 6#2 应为星期五', () => {
      expect(describeField('周', { mode: 'last', raw: '6L', value: '6' })).toContain('星期五');
      expect(
        describeField('周', { mode: 'nth', raw: '6#2', value: '6', secondary: '2' }),
      ).toContain('星期五');
    });

    it('选星期一应生成 Quartz 2', () => {
      const state = createDefaultCronState();
      state.day = createUnsetField();
      state.week = { mode: 'specific', raw: '2', value: '2' };
      const gen = generateCron(state);
      expect(gen.success).toBe(true);
      expect(gen.expression?.split(' ')[5]).toBe('2');
    });
  });

  describe('年字段不指定', () => {
    it('year unset 应生成 * 而非 ?', () => {
      const state = createDefaultCronState();
      state.year = { mode: 'unset', raw: '?' };
      const gen = generateCron(state);
      expect(gen.success).toBe(true);
      expect(gen.expression?.split(' ')[6]).toBe('*');
      expect(gen.expression).not.toMatch(/\?$/);
    });

    it('validateCronState 对 year unset 应通过', () => {
      const state = createDefaultCronState();
      state.year = { mode: 'unset', raw: '?' };
      expect(validateCronState(state).valid).toBe(true);
    });
  });

  describe('区间步长 a-b/n', () => {
    it('expandFieldValues 应展开 1-10/2', () => {
      expect(
        expandFieldValues(
          { mode: 'step', raw: '1-10/2', value: '1-10', secondary: '2' },
          0,
          59,
        ),
      ).toEqual([1, 3, 5, 7, 9]);
    });

    it('getNextRuns 对分钟 1-10/2 应能算出时间', () => {
      const state = createDefaultCronState();
      state.minute = { mode: 'step', raw: '1-10/2', value: '1-10', secondary: '2' };
      state.second = { mode: 'specific', raw: '0', value: '0' };
      const from = new Date(2026, 0, 1, 0, 0, 0);
      const runs = getNextRuns(state, 3, from);
      expect(runs.length).toBe(3);
      expect(runs.map((d) => d.getMinutes())).toEqual([1, 3, 5]);
    });
  });

  describe('6 段表达式启发式', () => {
    it('末段为年时应补秒而非把年塞进周', () => {
      expect(isYearLikeToken('2024')).toBe(true);
      const parsed = parseCron('0 0 2 * * 2024');
      expect(parsed.success).toBe(true);
      expect(parsed.state?.year.value ?? parsed.state?.year.raw).toMatch(/2024/);
      expect(parsed.state?.week.mode).not.toBe('specific');
      // 0 0 2 * * 2024 → 分时日月周年 → 0 0 0 2 * * 2024
      expect(parsed.expression).toBe('0 0 0 2 * ? 2024');
    });

    it('末段为 ? 时应补年 *', () => {
      const parsed = parseCron('0 0 2 * * ?');
      expect(parsed.success).toBe(true);
      expect(parsed.expression).toBe('0 0 2 * * ? *');
    });
  });

  describe('日周互斥解析规范化', () => {
    it('日具体 + 周 * 应规范化周为 ?', () => {
      const parsed = parseCron('0 0 0 15 * * *');
      expect(parsed.success).toBe(true);
      expect(parsed.state?.day.mode).toBe('specific');
      expect(parsed.state?.week.mode).toBe('unset');
      expect(parsed.expression?.split(' ')[5]).toBe('?');
    });

    it('日周同时具体应失败且不静默成功', () => {
      const parsed = parseCron('0 0 0 15 * 6 *');
      expect(parsed.success).toBe(false);
      expect(parsed.error).toContain('日和周');
    });
  });

  describe('isYearLikeToken / 边界', () => {
    it('quartzWeekShortLabel / matchesQuartzWeek 边界', () => {
      expect(quartzWeekShortLabel(2)).toBe('一');
      expect(quartzWeekShortLabel(-1)).toBe('-1');
      expect(quartzWeekShortLabel(99)).toBe('99');
      expect(quartzWeekShortLabel(Number.NaN)).toBe('NaN');
      expect(matchesQuartzWeek(0, [])).toBe(false);
      expect(matchesQuartzWeek(1, undefined as unknown as number[])).toBe(false);
    });

    it('应识别年区间与年步长，拒绝 */n 与越界年', () => {
      expect(isYearLikeToken('')).toBe(false);
      expect(isYearLikeToken('*')).toBe(false);
      expect(isYearLikeToken('2024-2030')).toBe(true);
      expect(isYearLikeToken('2030-2024')).toBe(false);
      expect(isYearLikeToken('2024/2')).toBe(true);
      expect(isYearLikeToken('1969')).toBe(false);
      expect(isYearLikeToken('*/2')).toBe(false);
      expect(isYearLikeToken('MON')).toBe(false);
      expect(isYearLikeToken('1899/1')).toBe(false);
    });

    it('步长非法应返回 null', () => {
      expect(
        expandFieldValues({ mode: 'step', raw: '0/0', value: '0', secondary: '0' }, 0, 59),
      ).toBeNull();
      expect(
        expandFieldValues(
          { mode: 'step', raw: '0/x', value: '0', secondary: 'x' },
          0,
          59,
        ),
      ).toBeNull();
    });

    it('步长缺省起点应按 */n 从 min 展开', () => {
      expect(
        expandFieldValues({ mode: 'step', raw: '*/15', value: '', secondary: '15' }, 0, 59),
      ).toEqual([0, 15, 30, 45]);
      expect(
        expandFieldValues({ mode: 'step', raw: '*/15', secondary: '15' }, 0, 59),
      ).toEqual([0, 15, 30, 45]);
    });

    it('非法 a-b/n 应展开失败', () => {
      expect(
        expandFieldValues(
          { mode: 'step', raw: '10-1/2', value: '10-1', secondary: '2' },
          0,
          59,
        ),
      ).toBeNull();
      expect(
        expandFieldValues(
          { mode: 'step', raw: 'a-b/2', value: 'a-b', secondary: '2' },
          0,
          59,
        ),
      ).toBeNull();
    });

    it('年字段为 ? 的 7 段应归一为年 *', () => {
      const parsed = parseCron('0 0 0 * * ? ?');
      expect(parsed.success).toBe(true);
      expect(parsed.state?.year.mode).toBe('unset');
      expect(parsed.expression?.endsWith(' *')).toBe(true);
    });

    it('nth 缺 value 时应降级文案', () => {
      expect(
        describeField('周', { mode: 'nth', raw: '#1', secondary: '1' }),
      ).toContain('第 1');
    });
  });

  describe('英文周写法 SUN/MON', () => {
    it('normalizeWeekFieldToken 应转换别名', () => {
      expect(normalizeWeekFieldToken('')).toBe('');
      expect(normalizeWeekFieldToken('MON-FRI')).toBe('2-6');
      expect(normalizeWeekFieldToken('FRI#2')).toBe('6#2');
      expect(normalizeWeekFieldToken('FRIL')).toBe('6L');
      expect(normalizeWeekFieldToken('SAT,SUN')).toBe('7,1');
      expect(weekAbbrToNumber('')).toBeNull();
      expect(weekAbbrToNumber('XXX')).toBeNull();
      expect(weekNumberToAbbr(2)).toBe('MON');
      expect(weekNumberToAbbr('6')).toBe('FRI');
      expect(weekNumberToAbbr(Number.NaN)).toBe('NaN');
      expect(weekNumberToAbbr(99)).toBe('99');
    });

    it('stringifyField abbr 应覆盖 list/last/nth/step 区间', () => {
      expect(
        stringifyField(
          { mode: 'list', raw: '2,6', values: ['2', '6'] },
          { fieldName: 'week', weekFormat: 'abbr' },
        ),
      ).toBe('MON,FRI');
      expect(
        stringifyField(
          { mode: 'last', raw: '6L', value: '6' },
          { fieldName: 'week', weekFormat: 'abbr' },
        ),
      ).toBe('FRIL');
      expect(
        stringifyField(
          { mode: 'nth', raw: '6#2', value: '6', secondary: '2' },
          { fieldName: 'week', weekFormat: 'abbr' },
        ),
      ).toBe('FRI#2');
      expect(
        stringifyField(
          { mode: 'step', raw: '2-6/1', value: '2-6', secondary: '1' },
          { fieldName: 'week', weekFormat: 'abbr' },
        ),
      ).toBe('MON-FRI/1');
      expect(
        stringifyField({ mode: 'list', raw: '', values: [] }, { fieldName: 'week' }),
      ).toBe('*');
      expect(
        stringifyField(
          { mode: 'list', raw: 'MON', value: 'MON' },
          { fieldName: 'week', weekFormat: 'abbr' },
        ),
      ).toBe('MON');
      expect(
        stringifyField({ mode: 'list', raw: '', value: '' }, { fieldName: 'hour' }),
      ).toBe('*');
      expect(stringifyField({ mode: 'list', raw: ',,,', value: ',,,' })).toBe('*');
    });

    it('非周英文字段应降级 warning', () => {
      const res = parseField('JAN', 'month');
      expect(res.warning).toContain('非标准写法');
    });

    it('应解析 0 0 2 ? * SAT,SUN *', () => {
      const parsed = parseCron('0 0 2 ? * SAT,SUN *');
      expect(parsed.success).toBe(true);
      expect(parsed.state?.week.mode).toBe('list');
      expect(parsed.state?.week.values).toEqual(['7', '1']);
    });

    it('generateCron weekFormat=abbr 应输出 MON', () => {
      const state = createDefaultCronState();
      state.day = createUnsetField();
      state.week = { mode: 'specific', raw: '2', value: '2' };
      const gen = generateCron(state, { weekFormat: 'abbr' });
      expect(gen.success).toBe(true);
      expect(gen.expression?.split(' ')[5]).toBe('MON');
    });

    it('generateCron abbr 区间应为 MON-FRI', () => {
      const state = createDefaultCronState();
      state.day = createUnsetField();
      state.week = { mode: 'range', raw: '2-6', value: '2', secondary: '6' };
      const gen = generateCron(state, { weekFormat: 'abbr' });
      expect(gen.expression?.split(' ')[5]).toBe('MON-FRI');
    });
  });

  describe('日周互斥 prefer 联动', () => {
    it('prefer=week 时应清日留周', () => {
      const state = createDefaultCronState();
      state.day = { mode: 'specific', raw: '15', value: '15' };
      state.week = { mode: 'specific', raw: '2', value: '2' };
      const { state: next, warning } = enforceDayWeekMutex(state, { prefer: 'week' });
      expect(next.day.mode).toBe('unset');
      expect(next.week.mode).toBe('specific');
      expect(warning).toContain('日');
    });

    it('prefer=day 时应清周留日', () => {
      const state = createDefaultCronState();
      state.day = { mode: 'specific', raw: '15', value: '15' };
      state.week = { mode: 'specific', raw: '2', value: '2' };
      const { state: next } = enforceDayWeekMutex(state, { prefer: 'day' });
      expect(next.day.mode).toBe('specific');
      expect(next.week.mode).toBe('unset');
    });
  });

  describe('经典表达式 round-trip', () => {
    const classics = [
      '0 0/5 * * * ? *',
      '0 0 2 ? * 1,7 *', // 周末凌晨 2 点（周日+周六）
      '0 0 9-18 ? * 2-6 *', // 工作日
      '0 0 0 1 * ? *',
      '0 0 0 L * ? *',
      '0 15 10 ? * 6L 2024-2030',
      '0 0 2 ? * SAT,SUN *',
      '0 0 9-18 ? * MON-FRI *',
    ];

    it.each(classics)('应能解析并再生成: %s', (expr) => {
      const parsed = parseCron(expr);
      expect(parsed.success).toBe(true);
      const gen = generateCron(parsed.state!);
      expect(gen.success).toBe(true);
      // 再解析生成结果应稳定
      const again = parseCron(gen.expression!);
      expect(again.success).toBe(true);
      const gen2 = generateCron(again.state!);
      expect(gen2.expression).toBe(gen.expression);
    });
  });
});

