import { describe, it, expect } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { nextTick, ref } from 'vue';
import { parseCron } from '@cron-zen/core';
import { useCronZen } from '../src/composables/useCronZen';
import CronZen from '../src/CronZen.vue';
import FieldEditor from '../src/components/FieldEditor.vue';

describe('有值回显 / 无值不注入默认', () => {
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

  it('CronZen 挂载 0 */5 时应落在分钟 Tab 并回显间隔', async () => {
    const wrapper = mount(CronZen, {
      props: { modelValue: '0 */5 * * * ? *', debounceMs: 0, showPreview: false },
    });
    await flushPromises();
    await nextTick();
    expect(wrapper.findAll('.cron-zen__tab')[1].classes()).toContain('is-active');
    expect(wrapper.text()).toContain('间隔');
    const radios = wrapper.findAll('.cz-row input[type="radio"]');
    expect((radios[2].element as HTMLInputElement).checked).toBe(true);
  });

  it('CronZen 挂载 0 1,11 时应落在分钟 Tab 并勾选 1 与 11', async () => {
    const wrapper = mount(CronZen, {
      props: { modelValue: '0 1,11 * * * ? *', debounceMs: 0, showPreview: false },
    });
    await flushPromises();
    await nextTick();
    expect(wrapper.findAll('.cron-zen__tab')[1].classes()).toContain('is-active');
    const listRadio = wrapper.find('.cz-row__head input[type="radio"]');
    expect((listRadio.element as HTMLInputElement).checked).toBe(true);
    const labels = wrapper
      .findAll('.cz-grid__check')
      .filter((l) => l.classes().includes('is-active'))
      .map((l) => l.text());
    expect(labels).toEqual(expect.arrayContaining(['01', '11']));
  });


  it('CronZen 空值应选中每秒而非指定，且不展示默认表达式', async () => {
    const wrapper = mount(CronZen, {
      props: { modelValue: '', debounceMs: 0, showPreview: false },
    });
    await flushPromises();
    const everyRadio = wrapper.findAll('.cz-row input[type="radio"]')[0];
    expect((everyRadio.element as HTMLInputElement).checked).toBe(true);
    const checked = wrapper.findAll('.cz-grid input[type="checkbox"]').filter(
      (c) => (c.element as HTMLInputElement).checked,
    );
    expect(checked.length).toBe(0);
  });

  it('空 modelValue 时内部 expression 也应为空', () => {
    const model = ref('');
    const { expression } = useCronZen({ modelValue: model, debounceMs: 0 });
    expect(expression.value).toBe('');
    expect(model.value).toBe('');
  });

  it('从秒 Tab 再切回分钟应仍回显间隔 */5', async () => {
    const wrapper = mount(CronZen, {
      props: { modelValue: '0 */5 * * * ? *', debounceMs: 0, showPreview: false },
    });
    await flushPromises();
    await wrapper.findAll('.cron-zen__tab')[0].trigger('click');
    await nextTick();
    await wrapper.findAll('.cron-zen__tab')[1].trigger('click');
    await nextTick();
    expect(wrapper.text()).toContain('间隔');
    const radios = wrapper.findAll('.cz-row input[type="radio"]');
    expect((radios[2].element as HTMLInputElement).checked).toBe(true);
    const nums = wrapper.findAll('input[type="number"]');
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

  it('秒为占位 0、分钟为 1,11 时应切到分钟 Tab', () => {
    const model = ref('0 1,11 * * * ? *');
    const { activeTab, state } = useCronZen({ modelValue: model, debounceMs: 0 });
    expect(activeTab.value).toBe('minute');
    expect(state.value.minute.mode).toBe('list');
    expect(state.value.minute.values).toEqual(['1', '11']);
  });

  it('秒为占位 0、分钟为 */5 时应切到分钟 Tab', () => {
    const model = ref('0 */5 * * * ? *');
    const { activeTab, state } = useCronZen({ modelValue: model, debounceMs: 0 });
    expect(activeTab.value).toBe('minute');
    expect(state.value.minute.mode).toBe('step');
  });

  it('秒为非 0 具体值时应留在秒 Tab', () => {
    const model = ref('15 * * * * ? *');
    const { activeTab } = useCronZen({ modelValue: model, debounceMs: 0 });
    expect(activeTab.value).toBe('second');
  });

  it('日=? 周=2 时应落在周 Tab（日 unset 不算具体）', () => {
    const model = ref('0 0 0 ? * 2 *');
    const { activeTab, state } = useCronZen({ modelValue: model, debounceMs: 0 });
    expect(state.value.day.mode).toBe('unset');
    expect(state.value.week.mode).toBe('specific');
    expect(activeTab.value).toBe('week');
  });

  it('空 v-model 不应被默认表达式写回', () => {
    const model = ref('');
    useCronZen({ modelValue: model, debounceMs: 0 });
    expect(model.value).toBe('');
  });
});
