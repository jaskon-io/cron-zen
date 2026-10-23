/**
 * @description FieldEditor locale=en-US 时 UI 行文案应英文化
 */
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import FieldEditor from '../src/components/FieldEditor.vue';
import CronZen from '../src/CronZen.vue';

describe('FieldEditor locale', () => {
  it('en-US 秒字段应展示 Every second / Range / Interval / Specific', () => {
    const wrapper = mount(FieldEditor, {
      props: {
        name: 'second',
        modelValue: { mode: 'every', raw: '*' },
        locale: 'en-US',
      },
    });
    const text = wrapper.text();
    expect(text).toContain('Every second');
    expect(text).toContain('Range');
    expect(text).toContain('Interval');
    expect(text).toContain('Specific');
    expect(text).not.toContain('每秒');
    expect(text).not.toContain('周期');
  });

  it('默认 zh-CN 仍为每秒 / 周期', () => {
    const wrapper = mount(FieldEditor, {
      props: {
        name: 'second',
        modelValue: { mode: 'every', raw: '*' },
      },
    });
    expect(wrapper.text()).toContain('每秒');
    expect(wrapper.text()).toContain('周期');
  });
});

describe('CronZen locale 透传', () => {
  it('locale=en-US 时 Tab 与复制按钮为英文', () => {
    const wrapper = mount(CronZen, {
      props: { modelValue: '', locale: 'en-US' },
    });
    expect(wrapper.text()).toContain('Second');
    expect(wrapper.text()).toContain('Every second');
    expect(wrapper.text()).toContain('Copy');
    expect(wrapper.text()).toContain('Reset');
    expect(wrapper.text()).toContain('Expression');
  });
});
