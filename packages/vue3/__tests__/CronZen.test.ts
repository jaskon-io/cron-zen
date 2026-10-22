import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { nextTick } from 'vue';
import CronZen from '../src/CronZen.vue';

describe('CronZen', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('应渲染七个字段 Tab，默认激活秒', () => {
    const wrapper = mount(CronZen, {
      props: { modelValue: '* * * * * ? *', debounceMs: 0 },
    });
    const tabs = wrapper.findAll('.cron-zen__tab');
    expect(tabs.length).toBe(7);
    expect(tabs[0].classes()).toContain('is-active');
    expect(tabs[0].text()).toBe('秒');
  });

  it('点击 Tab 应切换配置区标题', async () => {
    const wrapper = mount(CronZen, {
      props: { modelValue: '* * * * * ? *', debounceMs: 0 },
    });
    const tabs = wrapper.findAll('.cron-zen__tab');
    await tabs[2].trigger('click'); // 小时
    await nextTick();
    expect(wrapper.text()).toContain('每小时');
    expect(tabs[2].classes()).toContain('is-active');
  });

  it('配置日具体值后预览周应为 ?', async () => {
    const wrapper = mount(CronZen, {
      props: { modelValue: '* * * * * ? *', debounceMs: 0, showPreview: true },
    });
    // 切到日
    await wrapper.findAll('.cron-zen__tab')[3].trigger('click');
    await nextTick();
    // 点「指定」
    const radios = wrapper.findAll('.cz-row input[type="radio"]');
    const listRadio = radios[radios.length - 1];
    await listRadio.setValue(true);
    await listRadio.trigger('change');
    await flushPromises();
    vi.runAllTimers();
    await nextTick();
    const vals = wrapper.findAll('.cron-zen__field-val code').map((c) => c.text());
    // 日、周列：日有具体值，周为 ?
    expect(vals[3]).not.toBe('*');
    expect(vals[5]).toBe('?');
  });

  it('showPreview=false 时不应渲染近 N 次区块', () => {
    const wrapper = mount(CronZen, {
      props: { modelValue: '* * * * * ? *', showPreview: false },
    });
    expect(wrapper.text()).not.toContain('近');
    expect(wrapper.find('.cron-zen__preview').exists()).toBe(false);
  });

  it('重置应回到默认表达式并切回秒', async () => {
    const wrapper = mount(CronZen, {
      props: { modelValue: '0 0 8 * * ? *', debounceMs: 0 },
    });
    await wrapper.findAll('.cron-zen__tab')[2].trigger('click');
    await nextTick();
    const resetBtn = wrapper.findAll('.cron-zen__btn').find((b) => b.text() === '重置');
    expect(resetBtn).toBeTruthy();
    await resetBtn!.trigger('click');
    await nextTick();
    expect(wrapper.findAll('.cron-zen__tab')[0].classes()).toContain('is-active');
    expect(wrapper.emitted('update:modelValue')?.flat().at(-1)).toBe('* * * * * ? *');
  });

  it('切换 Tab 后配置区文案应隔离（无串字段）', async () => {
    const wrapper = mount(CronZen, {
      props: { modelValue: '* * * * * ? *', debounceMs: 0 },
    });
    await wrapper.findAll('.cron-zen__tab')[2].trigger('click'); // 小时
    await nextTick();
    expect(wrapper.text()).toContain('每小时');
    await wrapper.findAll('.cron-zen__tab')[5].trigger('click'); // 周
    await nextTick();
    expect(wrapper.text()).toContain('每周');
    expect(wrapper.text()).toContain('周字段写法');
    expect(wrapper.text()).not.toContain('每小时');
  });

  it('配置周具体值后日预览应为 ?，并显示互斥提示', async () => {
    const wrapper = mount(CronZen, {
      props: { modelValue: '* * * * * ? *', debounceMs: 0 },
    });
    // 先给日一个具体值
    await wrapper.findAll('.cron-zen__tab')[3].trigger('click');
    await nextTick();
    const dayRadios = wrapper.findAll('.cz-row input[type="radio"]');
    await dayRadios[dayRadios.length - 1].setValue(true);
    await dayRadios[dayRadios.length - 1].trigger('change');
    await flushPromises();
    vi.runAllTimers();
    await nextTick();

    // 再配置周
    await wrapper.findAll('.cron-zen__tab')[5].trigger('click');
    await nextTick();
    expect(wrapper.text()).toContain('日周互斥');
    const weekRadios = wrapper.findAll('.cz-row input[type="radio"]');
    await weekRadios[weekRadios.length - 1].setValue(true);
    await weekRadios[weekRadios.length - 1].trigger('change');
    await flushPromises();
    vi.runAllTimers();
    await nextTick();

    const vals = wrapper.findAll('.cron-zen__field-val code').map((c) => c.text());
    expect(vals[3]).toBe('?');
    expect(vals[5]).not.toBe('?');
  });

  it('点击预览区字段值应切换 Tab', async () => {
    const wrapper = mount(CronZen, {
      props: { modelValue: '* * * * * ? *', debounceMs: 0 },
    });
    const fieldVals = wrapper.findAll('.cron-zen__field-val');
    await fieldVals[4].trigger('click'); // 月
    await nextTick();
    expect(wrapper.findAll('.cron-zen__tab')[4].classes()).toContain('is-active');
    expect(wrapper.text()).toContain('每月');
  });
});

