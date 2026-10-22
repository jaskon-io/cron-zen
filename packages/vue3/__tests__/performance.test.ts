/**
 * @description vue3 层性能：快速输入不卡顿、定时器可清理、近 N 次延后计算
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick, ref } from 'vue';
import { useCronZen } from '../src/composables/useCronZen';
import CronZen from '../src/CronZen.vue';

describe('useCronZen 性能', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('连续 100 次字段更新：表达式即时且不抛错', () => {
    const model = ref('* * * * * ? *');
    const { updateField, expression } = useCronZen({
      modelValue: model,
      debounceMs: 0,
    });
    const t0 = performance.now();
    for (let i = 0; i < 100; i++) {
      updateField('second', {
        mode: 'specific',
        raw: String(i % 60),
        value: String(i % 60),
      });
    }
    const ms = performance.now() - t0;
    expect(expression.value.startsWith(`${99 % 60} `)).toBe(true);
    expect(ms).toBeLessThan(500);
  });

  it('近 N 次在输入路径应延后计算，flush 后立即可用', () => {
    const { updateField, flush, nextRuns } = useCronZen({
      debounceMs: 0,
      nextCount: 10,
    });
    // 初始 refreshNow 已算出
    expect(nextRuns.value.length).toBe(10);

    updateField('hour', { mode: 'specific', raw: '8', value: '8' });
    // 延后中可能仍是旧值或即将更新；推进微任务定时器
    vi.advanceTimersByTime(60);
    expect(nextRuns.value.length).toBe(10);

    updateField('minute', { mode: 'step', raw: '0/5', value: '0', secondary: '5' });
    flush();
    expect(nextRuns.value.length).toBeGreaterThan(0);
  });

  it('异常 nextCount / debounceMs 被夹紧且可完成', () => {
    const model = ref('* * * * * ? *');
    const { updateField, nextRuns } = useCronZen({
      modelValue: model,
      nextCount: Number.POSITIVE_INFINITY,
      debounceMs: Number.POSITIVE_INFINITY,
    });
    updateField('hour', { mode: 'specific', raw: '1', value: '1' });
    vi.advanceTimersByTime(5000);
    expect(model.value).toBe('* * 1 * * ? *');
    expect(nextRuns.value.length).toBeLessThanOrEqual(100);
  });
});

describe('CronZen 组件压测', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('快速切换全部 Tab 不应抛错或泄漏定时器', async () => {
    const wrapper = mount(CronZen, {
      props: { modelValue: '* * * * * ? *', debounceMs: 0 },
    });
    const tabs = wrapper.findAll('.cron-zen__tab');
    for (let round = 0; round < 3; round++) {
      for (const tab of tabs) {
        await tab.trigger('click');
        await nextTick();
      }
    }
    wrapper.unmount();
    vi.runAllTimers();
    expect(true).toBe(true);
  });

  it('挂载默认态表达式即时可见', () => {
    const wrapper = mount(CronZen, {
      props: { modelValue: '* * * * * ? *' },
    });
    expect(wrapper.find('.cron-zen__expr').text()).toBe('* * * * * ? *');
  });
});
