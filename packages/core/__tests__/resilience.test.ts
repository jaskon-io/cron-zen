/**
 * @description core 层性能 / 安全 / 边界韧性
 */
import { describe, it, expect } from 'vitest';
import {
  parseCron,
  generateCron,
  getNextRuns,
  createDefaultCronState,
  expandFieldValues,
  escapeCronPercent,
  unescapeCronPercent,
  validateCronState,
} from '../src/index';

describe('解析安全与边界', () => {
  it('拒绝超过 256 字符的输入', () => {
    const res = parseCron('0 '.repeat(200));
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/过长/);
  });

  it('拒绝 HTML / 脚本片段', () => {
    const res = parseCron('* * * <script>alert(1)</script> * ? *');
    expect(res.success).toBe(false);
  });

  it('拒绝控制字符与奇怪符号', () => {
    expect(parseCron('0 0 0 * * ? *\u0000').success).toBe(false);
    expect(parseCron('0 0 0 * * ? *\n; DROP TABLE').success).toBe(false);
  });

  it('null / 非字符串安全失败', () => {
    expect(parseCron(null as never).success).toBe(false);
    expect(parseCron(undefined as never).success).toBe(false);
    expect(parseCron(1 as never).success).toBe(false);
  });

  it('% 转义往返', () => {
    const raw = '0 0 2 * * ? * %job';
    const esc = escapeCronPercent(raw);
    expect(esc).toContain('\\%');
    expect(unescapeCronPercent(esc)).toBe(raw);
  });

  it('已转义 % 不重复转义', () => {
    expect(escapeCronPercent('0 0 0 * * ? * \\%x')).toBe('0 0 0 * * ? * \\%x');
  });
});

describe('性能与内存边界', () => {
  it('getNextRuns count=100 全 * 应快速返回', () => {
    const state = createDefaultCronState();
    const from = new Date(2026, 0, 1, 0, 0, 0);
    const t0 = performance.now();
    const runs = getNextRuns(state, 100, from);
    const ms = performance.now() - t0;
    expect(runs).toHaveLength(100);
    expect(ms).toBeLessThan(50);
  });


  it('getNextRuns 超大 count 不超过 100', () => {
    const runs = getNextRuns(createDefaultCronState(), 1e9, new Date(2026, 0, 1));
    expect(runs.length).toBeLessThanOrEqual(100);
  });

  it('expandFieldValues every 不因异常 min/max 死循环', () => {
    expect(expandFieldValues({ mode: 'every', raw: '*' }, 10, 1)).toBeNull();
    expect(expandFieldValues({ mode: 'every', raw: '*' }, Number.NaN, 10)).toBeNull();
  });

  it('大量 list 值应可生成或安全失败', () => {
    const state = createDefaultCronState();
    state.second = {
      mode: 'list',
      raw: Array.from({ length: 60 }, (_, i) => String(i)).join(','),
      values: Array.from({ length: 60 }, (_, i) => String(i)),
    };
    const res = generateCron(state);
    expect(res.success).toBe(true);
    expect(res.expression!.split(' ')[0].split(',').length).toBe(60);
  });

  it('连续 parse 100 次不应抛错', () => {
    for (let i = 0; i < 100; i++) {
      const res = parseCron(`0 ${i % 60} * * * ? *`);
      expect(res.success).toBe(true);
    }
  });
});

describe('校验韧性', () => {
  it('validateCronState 对默认状态通过', () => {
    expect(validateCronState(createDefaultCronState()).valid).toBe(true);
  });

  it('越界 hour 应失败', () => {
    const state = createDefaultCronState();
    state.hour = { mode: 'specific', raw: '99', value: '99' };
    expect(validateCronState(state).valid).toBe(false);
  });

  it('日周双具体应有错误', () => {
    const state = createDefaultCronState();
    state.day = { mode: 'specific', raw: '1', value: '1' };
    state.week = { mode: 'specific', raw: '2', value: '2' };
    const res = validateCronState(state);
    expect(res.valid).toBe(false);
  });
});
