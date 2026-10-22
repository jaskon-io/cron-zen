/**
 * @description 对齐 https://www.cron.ren/index.html 经典表达式表 + 6/7 段兼容
 */
import { describe, it, expect } from 'vitest';
import { parseCron, generateCron, describeCron, weekTokenUsesAbbr } from '../src';

/** cron.ren 页面「一些经典的cron表达式」表（多为 6 段，年可空） */
const CRON_REN_CLASSICS: Array<{ expr: string; hint: string }> = [
  { expr: '0 0/5 * * * ?', hint: '每5分钟' },
  { expr: '0 0,30 * * * ?', hint: '每30分钟' },
  { expr: '0 0/15 6-23 * * ?', hint: '早6到晚11每15分' },
  { expr: '0 0 2 ? * SAT,SUN', hint: '周末凌晨2点' },
  { expr: '0 0 9-18 * * MON-FRI', hint: '工作日9-18' },
  { expr: '0 0 0 1 * ?', hint: '每月1号凌晨' },
  { expr: '0 0 0 ? * MON', hint: '每周一凌晨' },
  { expr: '0 0 0 * * ?', hint: '每天凌晨' },
  { expr: '0 0 2,10,14,18 * * ?', hint: '每天多整点' },
  { expr: '0 0 2 1 1,4,7,10 ?', hint: '季度初' },
  { expr: '0 0 23 L * ?', hint: '月末23点' },
  { expr: '0 15 10 ? * 6L 2024-2030', hint: '年末周五上午' },
];

describe('cron.ren 经典表达式', () => {
  it.each(CRON_REN_CLASSICS)('应能解析: $hint ($expr)', ({ expr }) => {
    const parsed = parseCron(expr);
    expect(parsed.success).toBe(true);
    expect(parsed.state).toBeTruthy();
  });

  it.each(CRON_REN_CLASSICS)('parse→generate→parse 应稳定: $hint', ({ expr }) => {
    const parsed = parseCron(expr);
    expect(parsed.success).toBe(true);
    const weekPart = expr.trim().split(/\s+/)[5] ?? '';
    const weekFormat = weekTokenUsesAbbr(weekPart) ? 'abbr' : 'number';
    const gen = generateCron(parsed.state!, { weekFormat });
    expect(gen.success).toBe(true);
    expect(gen.expression).toBeTruthy();
    const again = parseCron(gen.expression!);
    expect(again.success).toBe(true);
    const gen2 = generateCron(again.state!, { weekFormat });
    expect(gen2.expression).toBe(gen.expression);
  });

  it.each([
    ['0 0/5 * * * ?', 'minute', 'step'],
    ['0 0,30 * * * ?', 'minute', 'list'],
    ['0 0/15 6-23 * * ?', 'hour', 'range'],
    ['0 0 2 ? * SAT,SUN', 'week', 'list'],
    ['0 0 0 1 * ?', 'day', 'specific'],
    ['0 0 0 ? * MON', 'week', 'specific'],
    ['0 0 23 L * ?', 'day', 'last'],
    ['0 15 10 ? * 6L 2024-2030', 'week', 'last'],
  ] as const)('%s 关键字段应为 %s.%s', (expr, field, mode) => {
    const parsed = parseCron(expr);
    expect(parsed.success).toBe(true);
    expect(parsed.state![field].mode).toBe(mode);
  });

  it('6 段缺年时应保持年不指定（不补默认 *）', () => {
    const parsed = parseCron('0 0/5 * * * ?');
    expect(parsed.success).toBe(true);
    expect(parsed.state?.year.mode).toBe('unset');
    const gen = generateCron(parsed.state!);
    expect(gen.expression!.split(/\s+/)).toHaveLength(6);
    expect(gen.expression).toBe('0 0/5 * * * ?');
  });

  it('经典表表达式应能生成可读描述', () => {
    for (const { expr } of CRON_REN_CLASSICS) {
      const parsed = parseCron(expr);
      expect(parsed.success).toBe(true);
      const desc = describeCron(parsed.state!);
      expect(typeof desc).toBe('string');
      expect(desc.length).toBeGreaterThan(0);
    }
  });
});
