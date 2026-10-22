import { describe, it, expect } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { nextTick, ref } from 'vue';
import { parseCron } from '@cron-zen/core';
import { useCronZen } from '../src/composables/useCronZen';
import CronZen from '../src/CronZen.vue';
import FieldEditor from '../src/components/FieldEditor.vue';

describe('有值回显 / 无值默认', () => {
  it('parse 0 */5 分钟应为 step * /5', () => {
    const p = parseCron('0 */5 * * * ? *');
    expect(p.success).toBe(true);
    expect(p.state?.second).toMatchObject({ mode: 'specific', value: '0' });
    expect(p.state?.minute).toMatchObject({ mode: 'step', value: '*', secondary: '5' });
  });

  it('useCronZen 加载有值应回显到 state', () => {
    const model = ref('0 */5 * * * ? *');
    const { state, expression } = useCronZen({ modelValue: model, debounceMs: 0 });
    expect(expression.value).toBe('0 */5 * * * ? *');
    expect(state.value.second.mode).toBe('specific');
    expect(state.value.minute.mode).toBe('step');
    expect(state.value.minute.secondary).toBe('5');
  });

  it('CronZen 挂载有值时秒应为指定且勾选 0', async () => {
    const wrapper = mount(CronZen, {
      props: { modelValue: '0 */5 * * * ? *', debounceMs: 0, showPreview: false },
    });
    await flushPromises();
    await nextTick();
    expect(wrapper.find('.cz-field').exists()).toBe(true);
    // 指定 radio checked
    const listRadio = wrapper.find('.cz-row__head input[type="radio"]');
    expect((listRadio.element as HTMLInputElement).checked).toBe(true);
    const checked = wrapper.findAll('.cz-grid input[type="checkbox"]').filter(
      (c) => (c.element as HTMLInputElement).checked,
    );
    expect(checked.length).toBe(1);
    expect(checked[0].element.parentElement?.textContent).toContain('00');
  });

  it('CronZen 无值/默认应选中每秒而非指定', async () => {
    const wrapper = mount(CronZen, {
      props: { modelValue: '* * * * * ? *', debounceMs: 0, showPreview: false },
    });
    await flushPromises();
    const everyRadio = wrapper.findAll('.cz-row input[type="radio"]')[0];
    expect((everyRadio.element as HTMLInputElement).checked).toBe(true);
    const checked = wrapper.findAll('.cz-grid input[type="checkbox"]').filter(
      (c) => (c.element as HTMLInputElement).checked,
    );
    expect(checked.length).toBe(0);
  });

  it('切换到分钟 Tab 应回显间隔 */5', async () => {
    const wrapper = mount(CronZen, {
      props: { modelValue: '0 */5 * * * ? *', debounceMs: 0, showPreview: false },
    });
    await flushPromises();
    await wrapper.findAll('.cron-zen__tab')[1].trigger('click');
    await nextTick();
    expect(wrapper.text()).toContain('间隔');
    const radios = wrapper.findAll('.cz-row input[type="radio"]');
    // 每分钟, 周期, 间隔, 指定 — 间隔 is index 2
    expect((radios[2].element as HTMLInputElement).checked).toBe(true);
    const nums = wrapper.findAll('input[type="number"]');
    // rangeStart, rangeEnd, stepBase, stepValue
    expect(Number((nums[3].element as HTMLInputElement).value)).toBe(5);
  });

  it('FieldEditor step */5 应选中间隔且 step=5', () => {
    const wrapper = mount(FieldEditor, {
      props: {
        name: 'minute',
        modelValue: { mode: 'step', raw: '*/5', value: '*', secondary: '5' },
      },
    });
    const radios = wrapper.findAll('input[type="radio"]');
    expect((radios[2].element as HTMLInputElement).checked).toBe(true);
  });

  it('仅分钟有值时应自动切到分钟 Tab 回显', () => {
    const model = ref('* */5 * * * ? *');
    const { activeTab, state } = useCronZen({ modelValue: model, debounceMs: 0 });
    expect(activeTab.value).toBe('minute');
    expect(state.value.minute.mode).toBe('step');
  });

  it('空 v-model 不应被默认表达式写回', () => {
    const model = ref('');
    useCronZen({ modelValue: model, debounceMs: 0 });
    expect(model.value).toBe('');
  });
});
