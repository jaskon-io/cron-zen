import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import FieldEditor from '../src/components/FieldEditor.vue';

describe('周周期倒序（对标 cron.ren 7-3）', () => {
  it('周六→周二 应输出 7-3 而非排序成 3-7', async () => {
    const wrapper = mount(FieldEditor, {
      props: { name: 'week', modelValue: { mode: 'unset', raw: '?' } },
    });
    const row = wrapper.findAll('.cz-row').find((l) => l.text().includes('周期'));
    const radio = row!.find('input[type="radio"]');
    await radio.setValue(true);
    await radio.trigger('change');
    const selects = row!.findAll('select');
    await selects[0].setValue(7);
    await selects[0].trigger('change');
    await selects[1].setValue(3);
    await selects[1].trigger('change');
    const last = wrapper.emitted('update:modelValue')!.at(-1)![0] as {
      raw?: string;
      value?: string;
      secondary?: string;
    };
    expect(last.raw).toBe('7-3');
    expect(last.value).toBe('7');
    expect(last.secondary).toBe('3');
  });
});
