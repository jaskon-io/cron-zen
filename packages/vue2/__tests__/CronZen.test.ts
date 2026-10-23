import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount, createLocalVue } from '@vue/test-utils';
import CronZen from '../src/CronZen.vue';

describe('CronZen', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('挂载后应显示表达式区', () => {
    const localVue = createLocalVue();
    const wrapper = mount(CronZen, {
      localVue,
      propsData: { value: '* * * * * ? *', debounceMs: 0 },
    });
    expect(wrapper.find('.cron-zen__expr').text()).toBe('* * * * * ? *');
  });

  it('空 value 不注入默认表达式文案占位', () => {
    const localVue = createLocalVue();
    const wrapper = mount(CronZen, {
      localVue,
      propsData: { value: '', debounceMs: 0 },
    });
    expect(wrapper.find('.cron-zen__expr').text()).toMatch(/编辑后生成|^\s*$/);
  });

  it('点击 Tab 应切换激活态', async () => {
    const localVue = createLocalVue();
    const wrapper = mount(CronZen, {
      localVue,
      propsData: { value: '* * * * * ?', debounceMs: 0 },
    });
    const tabs = wrapper.findAll('.cron-zen__tab');
    expect(tabs.length).toBeGreaterThan(3);
    await tabs.at(2).trigger('click');
    expect(tabs.at(2).classes()).toContain('is-active');
  });

  it('showPreview=false 时应隐藏预览区', () => {
    const localVue = createLocalVue();
    const wrapper = mount(CronZen, {
      localVue,
      propsData: { value: '* * * * * ?', showPreview: false },
    });
    expect(wrapper.find('.cron-zen__preview').exists()).toBe(false);
    expect(wrapper.find('.cron-zen').classes()).toContain('cron-zen--compact');
  });
});
