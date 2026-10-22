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

  it('默认应从秒 Tab 开始，表达式对齐 cron.ren', () => {
    const { activeTab, expression } = useCronZen({ debounceMs: 0 });
    expect(activeTab.value).toBe('second');
    expect(expression.value).toBe('* * * * * ? *');
  });

  it('配置日具体值时应立即把周改为 ?', () => {
    const model = ref('* * * * * ? *');
    const { state, updateField, expression } = useCronZen({
      modelValue: model,
      debounceMs: 0,
    });

    updateField('day', { mode: 'specific', raw: '15', value: '15' });
    expect(state.value.day.mode).toBe('specific');
    expect(state.value.week.mode).toBe('unset');
    expect(expression.value).toBe('* * * 15 * ? *');
    expect(model.value).toBe('* * * 15 * ? *');
  });

  it('在已有日的情况下配置周，应清日留周（prefer=week）', () => {
    const { state, updateField, expression } = useCronZen({ debounceMs: 0 });

    updateField('day', { mode: 'specific', raw: '15', value: '15' });
    updateField('week', { mode: 'specific', raw: '2', value: '2' });

    expect(state.value.week.mode).toBe('specific');
    expect(state.value.day.mode).toBe('unset');
    expect(expression.value).toBe('* * * ? * 2 *');
  });

  it('setWeekFormat(abbr) 应将周一输出为 MON', () => {
    const { updateField, setWeekFormat, expression } = useCronZen({ debounceMs: 0 });
    updateField('week', { mode: 'specific', raw: '2', value: '2' });
    setWeekFormat('abbr');
    expect(expression.value).toBe('* * * ? * MON *');
  });

  it('非法表达式不应覆盖 v-model', async () => {
    const model = ref('* * * * * ? *');
    const { loadExpression, hint, expression } = useCronZen({
      modelValue: model,
      debounceMs: 0,
    });

    loadExpression('0 0 0 15 * 6 *');
    await nextTick();
    expect(hint.value).toContain('日和周');
    expect(expression.value).toBe('0 0 0 15 * 6 *');
    expect(model.value).toBe('* * * * * ? *');
  });

  it('外部 v-model 变更应反解析', async () => {
    const model = ref('* * * * * ? *');
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
    expect(expression.value).toBe('* * * * * ? *');
  });

  it('非日周字段应防抖后再写回表达式', () => {
    const model = ref('* * * * * ? *');
    const { updateField, expression } = useCronZen({
      modelValue: model,
      debounceMs: 300,
    });
    updateField('hour', { mode: 'specific', raw: '8', value: '8' });
    expect(expression.value).toBe('* * * * * ? *');
    vi.advanceTimersByTime(300);
    expect(expression.value).toBe('* * 8 * * ? *');
    expect(model.value).toBe('* * 8 * * ? *');
  });

  it('flush 应立即刷新防抖中的变更', () => {
    const { updateField, flush, expression } = useCronZen({ debounceMs: 500 });
    updateField('minute', { mode: 'step', raw: '0/5', value: '0', secondary: '5' });
    expect(expression.value).toBe('* * * * * ? *');
    flush();
    expect(expression.value).toBe('* 0/5 * * * ? *');
  });

  it('list 选周一三五应为 2,4,6', () => {
    const { updateField, expression } = useCronZen({ debounceMs: 0 });
    updateField('week', {
      mode: 'list',
      raw: '2,4,6',
      value: '2,4,6',
      values: ['2', '4', '6'],
    });
    expect(expression.value).toBe('* * * ? * 2,4,6 *');
  });

  it('year unset 应输出年 *', () => {
    const { updateField, expression } = useCronZen({ debounceMs: 0 });
    updateField('year', { mode: 'unset', raw: '?' });
    expect(expression.value.endsWith(' *')).toBe(true);
    expect(expression.value.split(' ')[6]).toBe('*');
  });

  it('英文周表达式应自动切 abbr 写法', () => {
    const { loadExpression, weekFormat, expression } = useCronZen({ debounceMs: 0 });
    loadExpression('0 0 9 ? * MON-FRI *');
    expect(weekFormat.value).toBe('abbr');
    expect(expression.value).toContain('MON-FRI');
  });

  it('showPreview=false 时不计算 nextRuns/description', () => {
    const { updateField, nextRuns, description } = useCronZen({
      debounceMs: 0,
      showPreview: false,
    });
    updateField('hour', { mode: 'specific', raw: '8', value: '8' });
    expect(nextRuns.value).toEqual([]);
    expect(description.value).toBe('');
  });

  it('连续改日再改周应始终保持互斥且 prefer 最近一侧', () => {
    const { updateField, expression, state } = useCronZen({ debounceMs: 0 });
    updateField('day', { mode: 'list', raw: '1,15', value: '1,15', values: ['1', '15'] });
    expect(expression.value).toBe('* * * 1,15 * ? *');
    updateField('week', {
      mode: 'range',
      raw: '2-6',
      value: '2',
      secondary: '6',
    });
    expect(state.value.day.mode).toBe('unset');
    expect(expression.value).toBe('* * * ? * 2-6 *');
    updateField('day', { mode: 'last', raw: 'L' });
    expect(state.value.week.mode).toBe('unset');
    expect(expression.value).toBe('* * * L * ? *');
  });
});
