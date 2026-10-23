/**
 * @description vanilla 层性能与夹紧
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createCronZen, type CronZenModel } from '../src/createCronZen';
import { mountCronZen } from '../src/mount';

function modelRef(initial = '* * * * * ? *'): CronZenModel & { _v: string } {
  const m = {
    _v: initial,
    get value() {
      return m._v;
    },
    set value(v: string | undefined) {
      m._v = v ?? '';
    },
  };
  return m;
}

describe('createCronZen 性能', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('连续 100 次字段更新应 < 500ms', () => {
    const model = modelRef();
    const ctrl = createCronZen({ modelValue: model, debounceMs: 0 });
    const t0 = performance.now();
    for (let i = 0; i < 100; i++) {
      ctrl.updateField('second', {
        mode: 'specific',
        raw: String(i % 60),
        value: String(i % 60),
      });
    }
    expect(performance.now() - t0).toBeLessThan(500);
    expect(ctrl.getSnapshot().expression.startsWith(`${99 % 60} `)).toBe(true);
    ctrl.destroy();
  });

  it('异常 nextCount / debounceMs 被夹紧', () => {
    const model = modelRef();
    const ctrl = createCronZen({
      modelValue: model,
      nextCount: Number.POSITIVE_INFINITY,
      debounceMs: Number.POSITIVE_INFINITY,
    });
    ctrl.updateField('hour', { mode: 'specific', raw: '1', value: '1' });
    vi.advanceTimersByTime(5000);
    expect(model.value).toBe('* * 1 * * ? *');
    expect(ctrl.getSnapshot().nextRuns.length).toBeLessThanOrEqual(100);
    ctrl.destroy();
  });

  it('超长非法表达式不写入 expression', () => {
    const huge = `${'0 '.repeat(200)}*`;
    const ctrl = createCronZen({ debounceMs: 0 });
    const before = ctrl.getSnapshot().expression;
    ctrl.loadExpression(huge);
    expect(ctrl.getSnapshot().hint).toMatch(/过长|非法|无效/);
    expect(ctrl.getSnapshot().expression).toBe(before);
    ctrl.destroy();
  });
});

describe('mount 压测', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="app"></div>';
    vi.useFakeTimers();
  });
  afterEach(() => {
    document.body.innerHTML = '';
    vi.useRealTimers();
  });

  it('快速切换 Tab 不应抛错', () => {
    const api = mountCronZen('#app', { value: '* * * * * ? *', debounceMs: 0 });
    const tabs = document.querySelectorAll<HTMLButtonElement>('.cron-zen__tab');
    for (let r = 0; r < 3; r++) {
      for (const tab of tabs) tab.click();
    }
    api.destroy();
    vi.runAllTimers();
    expect(true).toBe(true);
  });
});
