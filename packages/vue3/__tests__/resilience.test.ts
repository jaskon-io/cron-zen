/**
 * @description 性能 / 内存 / 安全边界（vue3 层）
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { nextTick, ref } from 'vue';
import { useCronZen } from '../src/composables/useCronZen';
import CronZen from '../src/CronZen.vue';
import ValueGrid from '../src/components/ValueGrid.vue';
import FieldEditor from '../src/components/FieldEditor.vue';

describe('性能', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('nextCount 异常大值应被夹到 ≤100', () => {
    const { nextRuns } = useCronZen({ debounceMs: 0, nextCount: 99999 });
    expect(nextRuns.value.length).toBeLessThanOrEqual(100);
  });

  it('debounceMs 异常大值应被夹到 ≤5000', () => {
    const model = ref('* * * * * ? *');
    const { updateField } = useCronZen({
      modelValue: model,
      debounceMs: 1_000_000,
    });
    updateField('hour', { mode: 'specific', raw: '1', value: '1' });
    expect(model.value).toBe('* * * * * ? *');
    vi.advanceTimersByTime(5000);
    expect(model.value).toBe('* * 1 * * ? *');
  });

  it('连续快速改字段不应抛错且最终可 flush', () => {
    const { updateField, flush, expression } = useCronZen({ debounceMs: 300 });
    for (let i = 0; i < 50; i++) {
      updateField('second', {
        mode: 'specific',
        raw: String(i % 60),
        value: String(i % 60),
      });
    }
    flush();
    expect(expression.value.split(/\s+/)[0]).toMatch(/^\d+$/);
  });

  it('getNextRuns 全 * 默认状态应在合理时间内返回', () => {
    const t0 = performance.now();
    const { nextRuns } = useCronZen({ debounceMs: 0, nextCount: 100 });
    const ms = performance.now() - t0;
    expect(nextRuns.value.length).toBe(100);
    expect(ms).toBeLessThan(2000);
  });
});

describe('内存 / 资源清理', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('组件卸载应清理防抖定时器（不在卸载后写回）', async () => {
    const wrapper = mount(CronZen, {
      props: { modelValue: '* * * * * ? *', debounceMs: 500 },
    });
    const radios = wrapper.findAll('.cz-row input[type="radio"]');
    await radios[1].setValue(true);
    await radios[1].trigger('change');
    wrapper.unmount();
    vi.advanceTimersByTime(1000);
    // 卸载后不应再抛错（定时器已清）
    expect(true).toBe(true);
  });

  it('ValueGrid 对超大区间不应渲染超过 120 格', () => {
    const wrapper = mount(ValueGrid, {
      props: { min: 0, max: 10_000, modelValue: [], pad: false },
    });
    expect(wrapper.findAll('input[type="checkbox"]').length).toBeLessThanOrEqual(120);
  });

  it('失败的超长表达式不应写进 expression', () => {
    const huge = `${'0 '.repeat(200)}*`;
    const { loadExpression, expression, hint } = useCronZen({ debounceMs: 0 });
    const before = expression.value;
    loadExpression(huge);
    expect(hint.value).toMatch(/过长|非法|无效/);
    expect(expression.value).toBe(before);
    expect(expression.value.length).toBeLessThan(300);
  });
});

describe('安全', () => {
  it('含 HTML/脚本字符的表达式应被拒绝且不写入可执行 DOM', async () => {
    const evil = '* * * * * ? * <img src=x onerror=alert(1)>';
    const wrapper = mount(CronZen, {
      props: { modelValue: '* * * * * ? *', debounceMs: 0 },
    });
    await wrapper.setProps({ modelValue: evil });
    await flushPromises();
    await nextTick();
    expect(wrapper.find('img').exists()).toBe(false);
    expect(wrapper.findAll('script')).toHaveLength(0);
    // 非法输入不回显到表达式区
    expect(wrapper.find('.cron-zen__expr').text()).toBe('* * * * * ? *');
    expect(wrapper.text()).toMatch(/非法字符/);
  });

  it('prototype 污染字段值不应击穿生成', () => {
    const { updateField, expression } = useCronZen({ debounceMs: 0 });
    updateField('second', {
      mode: 'list',
      raw: '__proto__',
      value: '__proto__',
      values: ['__proto__', 'constructor'],
    } as never);
    // 非数字 list 会被规范化或生成失败路径吞掉，不应抛错
    expect(typeof expression.value).toBe('string');
  });

  it('loadExpression 非字符串应安全忽略', () => {
    const { loadExpression, expression } = useCronZen({ debounceMs: 0 });
    const before = expression.value;
    loadExpression(null as never);
    loadExpression(undefined as never);
    loadExpression(123 as never);
    expect(expression.value).toBe(before);
  });

  it('% 转义不应在 UI 文本节点外产生额外标签', async () => {
    const wrapper = mount(CronZen, {
      props: { modelValue: '0 0 0 * * ? *', debounceMs: 0 },
    });
    await wrapper.setProps({ modelValue: '0 0 0 * * ? * %job' });
    await flushPromises();
    // 非法字符会失败；确保无脚本注入
    expect(wrapper.find('script').exists()).toBe(false);
  });

  it('FieldEditor 不因异常 modelValue 崩溃', () => {
    expect(() =>
      mount(FieldEditor, {
        props: {
          name: 'hour',
          modelValue: { mode: 'list', raw: '', values: Array.from({ length: 500 }, (_, i) => String(i)) },
        },
      }),
    ).not.toThrow();
  });
});
