import { describe, it, expect } from 'vitest';
import { normalizeCronKey, resolveCronDisplay } from '../src/resolveCronDisplay';
import { parseCron } from '../src/parser';
import { describeCron } from '../src/describe';

describe('normalizeCronKey', () => {
  it('应压缩空白并去掉年段 *', () => {
    expect(normalizeCronKey('  0  0  9 * * ? *  ')).toBe('0 0 9 * * ?');
  });

  it('应把全角问号归一', () => {
    expect(normalizeCronKey('0 0 9 * * ？')).toBe('0 0 9 * * ?');
  });
});

describe('resolveCronDisplay', () => {
  it('空表达式应返回空展示', () => {
    expect(resolveCronDisplay('')).toEqual({
      description: '',
      nextRun: '',
      matched: false,
    });
  });

  it('命中频率表时应优先用业务名', () => {
    const info = resolveCronDisplay('0 0 9 * * ?', [
      { cronExpression: '0 0 9 * * ? *', frequencyName: '每天上午9点' },
    ]);
    expect(info.matched).toBe(true);
    expect(info.description).toBe('每天上午9点');
    expect(info.nextRun).toMatch(/^下次执行：/);
  });

  it('未命中频率表时应走口语化 describeCron', () => {
    const info = resolveCronDisplay('0 0/5 * * * ?');
    expect(info.matched).toBe(false);
    expect(info.description).toBe('每5分钟执行');
    expect(info.nextRun).toMatch(/^下次执行：/);
  });

  it('工作日 9 点应语义化为工作日9点执行', () => {
    const parsed = parseCron('0 0 9 ? * 2-6');
    expect(parsed.success).toBe(true);
    expect(describeCron(parsed.state!)).toBe('工作日9点执行');
  });

  it('每天多时刻应合并上午/下午时段', () => {
    const parsed = parseCron('0 0 10,14,16 * * ?');
    expect(parsed.success).toBe(true);
    expect(describeCron(parsed.state!)).toBe('每天上午10点，下午2点，4点');
  });
});
