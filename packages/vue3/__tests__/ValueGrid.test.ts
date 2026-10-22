import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import ValueGrid from '../src/components/ValueGrid.vue';

describe('ValueGrid', () => {
  it('应按 min/max 渲染格子', () => {
    const wrapper = mount(ValueGrid, {
      props: {
        min: 0,
        max: 5,
        modelValue: [1],
        pad: true,
      },
    });
    const cells = wrapper.findAll('label');
    expect(cells.length).toBe(6);
    expect(wrapper.text()).toContain('01');
  });

  it('勾选应 emit 合并后的列表', async () => {
    const wrapper = mount(ValueGrid, {
      props: {
        min: 1,
        max: 3,
        modelValue: [1],
        pad: false,
      },
    });
    const inputs = wrapper.findAll('input[type="checkbox"]');
    await inputs[1].trigger('change'); // toggle 2
    const emitted = wrapper.emitted('update:modelValue');
    expect(emitted?.at(-1)?.[0]).toEqual([1, 2]);
  });

  it('自定义 order 应按给定顺序渲染', () => {
    const wrapper = mount(ValueGrid, {
      props: {
        min: 1,
        max: 7,
        modelValue: [2],
        order: [2, 3, 1],
        labels: { 1: '日', 2: '一', 3: '二' },
        pad: false,
      },
    });
    const text = wrapper.text().replace(/\s+/g, '');
    expect(text.indexOf('一')).toBeLessThan(text.indexOf('二'));
    expect(text.indexOf('二')).toBeLessThan(text.indexOf('日'));
  });
});
