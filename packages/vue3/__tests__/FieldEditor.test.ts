import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import FieldEditor from '../src/components/FieldEditor.vue';

describe('FieldEditor', () => {
  it('秒字段默认应展示每秒选项', () => {
    const wrapper = mount(FieldEditor, {
      props: {
        name: 'second',
        modelValue: { mode: 'every', raw: '*' },
      },
    });
    expect(wrapper.text()).toContain('每秒');
    expect(wrapper.text()).toContain('指定');
  });

  it('周字段应展示写法开关与中文星期', () => {
    const wrapper = mount(FieldEditor, {
      props: {
        name: 'week',
        modelValue: { mode: 'unset', raw: '?' },
        weekFormat: 'number',
      },
    });
    expect(wrapper.text()).toContain('周字段写法');
    expect(wrapper.text()).toContain('星期一');
    expect(wrapper.text()).toContain('SUN');
  });

  it('选择指定应 emit list 状态', async () => {
    const wrapper = mount(FieldEditor, {
      props: {
        name: 'hour',
        modelValue: { mode: 'every', raw: '*' },
      },
    });
    const radios = wrapper.findAll('input[type="radio"]');
    const listRadio = radios[radios.length - 1];
    await listRadio.setValue(true);
    await listRadio.trigger('change');
    const emitted = wrapper.emitted('update:modelValue');
    expect(emitted?.length).toBeGreaterThan(0);
    const last = emitted![emitted!.length - 1][0] as { mode: string };
    expect(last.mode).toBe('list');
  });

  it('切换周写法应 emit update:weekFormat', async () => {
    const wrapper = mount(FieldEditor, {
      props: {
        name: 'week',
        modelValue: { mode: 'unset', raw: '?' },
        weekFormat: 'number',
      },
    });
    const radios = wrapper.findAll('.cz-week-format input[type="radio"]');
    expect(radios.length).toBe(2);
    await radios[1].setValue(true);
    await radios[1].trigger('change');
    expect(wrapper.emitted('update:weekFormat')?.[0]).toEqual(['abbr']);
  });
});
