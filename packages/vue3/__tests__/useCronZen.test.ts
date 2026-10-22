import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ref, nextTick } from 'vue';
import { useCronZen } from '../src/composables/useCronZen';

describe('useCronZen', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('默认应从秒 Tab 开始，表达式为每天 0 点', () => {
    const { activeTab, expression } = useCronZen({ debounceMs: 0 });
    expect(activeTab.value).toBe('second');
    expect(expression.value).toBe('0 0 0 * * ? *');
  });

  it('配置日具体值时应立即把周改为 ?', () => {
    const model = ref('0 0 0 * * ? *');
    const { state, updateField, expression } = useCronZen({
      modelValue: model,
      debounceMs: 0,
    });

    updateField('day', { mode: 'specific', raw: '15', value: '15' });
    expect(state.value.day.mode).toBe('specific');
    expect(state.value.week.mode).toBe('unset');
    expect(expression.value).toBe('0 0 0 15 * ? *');
    expect(model.value).toBe('0 0 0 15 * ? *');
  });

  it('在已有日的情况下配置周，应清日留周（prefer=week）', () => {
    const { state, updateField, expression } = useCronZen({ debounceMs: 0 });

    updateField('day', { mode: 'specific', raw: '15', value: '15' });
    updateField('week', { mode: 'specific', raw: '2', value: '2' });

    expect(state.value.week.mode).toBe('specific');
    expect(state.value.day.mode).toBe('unset');
    expect(expression.value).toBe('0 0 0 ? * 2 *');
  });

  it('setWeekFormat(abbr) 应将周一输出为 MON', () => {
    const { updateField, setWeekFormat, expression } = useCronZen({ debounceMs: 0 });
    updateField('week', { mode: 'specific', raw: '2', value: '2' });
    setWeekFormat('abbr');
    expect(expression.value).toBe('0 0 0 ? * MON *');
  });

  it('非法表达式不应覆盖 v-model', async () => {
    const model = ref('0 0 0 * * ? *');
    const { loadExpression, hint, expression } = useCronZen({
      modelValue: model,
      debounceMs: 0,
    });

    loadExpression('0 0 0 15 * 6 *');
    await nextTick();
    expect(hint.value).toContain('日和周');
    expect(expression.value).toBe('0 0 0 15 * 6 *');
    expect(model.value).toBe('0 0 0 * * ? *');
  });

  it('外部 v-model 变更应反解析', async () => {
    const model = ref('0 0 0 * * ? *');
    const { expression, state } = useCronZen({ modelValue: model, debounceMs: 0 });
    // 清掉内部写回 v-model 的 syncingOut 微延迟
    vi.runAllTimers();
    await nextTick();
    model.value = '0 0 9 ? * MON *';
    await nextTick();
    expect(state.value.week.mode).toBe('specific');
    expect(state.value.week.value).toBe('2');
    expect(expression.value.split(' ')[5]).toMatch(/^(MON|2)$/);
  });

  it('reset 应回到默认', () => {
    const { updateField, reset, expression } = useCronZen({ debounceMs: 0 });
    updateField('hour', { mode: 'specific', raw: '8', value: '8' });
    reset();
    expect(expression.value).toBe('0 0 0 * * ? *');
  });
});
