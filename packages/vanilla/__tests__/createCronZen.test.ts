import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createCronZen, type CronZenModel } from '../src/createCronZen';

function modelRef(initial = '* * * * * ?'): CronZenModel & { _v: string } {
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

describe('createCronZen', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('默认应从秒 Tab 开始，表达式对齐 cron.ren', () => {
    const ctrl = createCronZen({ debounceMs: 0 });
    const snap = ctrl.getSnapshot();
    expect(snap.activeTab).toBe('second');
    expect(snap.expression).toBe('* * * * * ?');
    ctrl.destroy();
  });

  it('配置日具体值时应立即把周改为 ?', () => {
    const model = modelRef();
    const ctrl = createCronZen({ modelValue: model, debounceMs: 0 });
    ctrl.updateField('day', { mode: 'specific', raw: '15', value: '15' });
    const snap = ctrl.getSnapshot();
    expect(snap.state.day.mode).toBe('specific');
    expect(snap.state.week.mode).toBe('unset');
    expect(snap.expression).toBe('* * * 15 * ?');
    expect(model.value).toBe('* * * 15 * ?');
    ctrl.destroy();
  });

  it('在已有日的情况下配置周，应清日留周', () => {
    const ctrl = createCronZen({ debounceMs: 0 });
    ctrl.updateField('day', { mode: 'specific', raw: '15', value: '15' });
    ctrl.updateField('week', { mode: 'specific', raw: '2', value: '2' });
    const snap = ctrl.getSnapshot();
    expect(snap.state.week.mode).toBe('specific');
    expect(snap.state.day.mode).toBe('unset');
    expect(snap.expression).toBe('* * * ? * 2');
    ctrl.destroy();
  });

  it('setWeekFormat(abbr) 应将周一输出为 MON', () => {
    const ctrl = createCronZen({ debounceMs: 0 });
    ctrl.updateField('week', { mode: 'specific', raw: '2', value: '2' });
    ctrl.setWeekFormat('abbr');
    expect(ctrl.getSnapshot().expression).toBe('* * * ? * MON');
    ctrl.destroy();
  });

  it('非法表达式不应覆盖 v-model', () => {
    const model = modelRef();
    const ctrl = createCronZen({ modelValue: model, debounceMs: 0 });
    ctrl.loadExpression('0 0 0 15 * 6 *');
    expect(ctrl.getSnapshot().hint).toContain('日和周');
    expect(model.value).toBe('* * * * * ?');
    ctrl.destroy();
  });

  it('非日周字段：预览即时，v-model 按防抖写回', () => {
    const model = modelRef();
    const ctrl = createCronZen({ modelValue: model, debounceMs: 300 });
    ctrl.updateField('hour', { mode: 'specific', raw: '8', value: '8' });
    expect(ctrl.getSnapshot().expression).toBe('* * 8 * * ?');
    expect(model.value).toBe('* * * * * ?');
    vi.advanceTimersByTime(300);
    expect(model.value).toBe('* * 8 * * ?');
    ctrl.destroy();
  });

  it('flush 应立即写回', () => {
    const model = modelRef();
    const ctrl = createCronZen({ modelValue: model, debounceMs: 500 });
    ctrl.updateField('minute', {
      mode: 'step',
      raw: '0/5',
      value: '0',
      secondary: '5',
    });
    expect(model.value).toBe('* * * * * ?');
    ctrl.flush();
    expect(model.value).toBe('* 0/5 * * * ?');
    ctrl.destroy();
  });

  it('showPreview=false 时不计算 nextRuns/description', () => {
    const ctrl = createCronZen({ debounceMs: 0, showPreview: false });
    ctrl.updateField('hour', { mode: 'specific', raw: '8', value: '8' });
    const snap = ctrl.getSnapshot();
    expect(snap.nextRuns).toEqual([]);
    expect(snap.description).toBe('');
    ctrl.destroy();
  });

  it('reset 应回到默认并还原 weekFormat', () => {
    const ctrl = createCronZen({ debounceMs: 0 });
    ctrl.updateField('week', { mode: 'specific', raw: '2', value: '2' });
    ctrl.setWeekFormat('abbr');
    ctrl.reset();
    const snap = ctrl.getSnapshot();
    expect(snap.weekFormat).toBe('number');
    expect(snap.expression).toBe('* * * * * ?');
    ctrl.destroy();
  });

  it('subscribe 在更新后触发', () => {
    const ctrl = createCronZen({ debounceMs: 0 });
    const spy = vi.fn();
    const off = ctrl.subscribe(spy);
    ctrl.updateField('hour', { mode: 'specific', raw: '9', value: '9' });
    expect(spy).toHaveBeenCalled();
    off();
    ctrl.destroy();
  });

  it('destroy 后不应再写回防抖', () => {
    const model = modelRef();
    const ctrl = createCronZen({ modelValue: model, debounceMs: 300 });
    ctrl.updateField('hour', { mode: 'specific', raw: '1', value: '1' });
    ctrl.destroy();
    vi.advanceTimersByTime(500);
    expect(model.value).toBe('* * * * * ?');
  });

  it('经典表达式可 load', () => {
    const classics = [
      '0 0/5 * * * ? *',
      '0 0 2 ? * SAT,SUN *',
      '0 0 0 L * ? *',
    ];
    for (const expr of classics) {
      const ctrl = createCronZen({ debounceMs: 0 });
      ctrl.loadExpression(expr);
      expect(ctrl.getSnapshot().expression.split(/\s+/).length).toBeGreaterThanOrEqual(6);
      ctrl.destroy();
    }
  });
});
