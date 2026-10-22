import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { nextTick, defineComponent, h } from 'vue';
import CronZenPicker from '../src/CronZenPicker.vue';

const messageError = vi.fn();

vi.mock('element-plus', () => {
  const passthrough = (tag: string) =>
    defineComponent({
      name: tag,
      props: {
        modelValue: { type: [String, Boolean, Number], default: undefined },
        disabled: Boolean,
        readonly: Boolean,
        clearable: Boolean,
        size: String,
        type: String,
        title: String,
        width: [String, Number],
        placeholder: String,
      },
      emits: ['update:modelValue', 'click', 'closed'],
      setup(props, { slots, emit, attrs }) {
        return () =>
          h(
            tag === 'ElDialog' ? 'div' : tag === 'ElButton' ? 'button' : 'div',
            {
              ...attrs,
              class: `stub-${tag}`,
              disabled: props.disabled,
              onClick: (e: Event) => emit('click', e),
            },
            slots.default?.({ open: () => undefined, disabled: false }) ?? slots.default?.(),
          );
      },
    });

  return {
    ElButton: passthrough('ElButton'),
    ElInput: defineComponent({
      name: 'ElInput',
      props: {
        modelValue: { type: String, default: '' },
        disabled: Boolean,
        readonly: Boolean,
        clearable: Boolean,
        size: String,
        placeholder: String,
      },
      emits: ['update:modelValue'],
      setup(props, { emit }) {
        return () =>
          h('input', {
            class: 'stub-ElInput',
            value: props.modelValue,
            disabled: props.disabled,
            readonly: props.readonly,
            placeholder: props.placeholder,
            onInput: (e: Event) =>
              emit('update:modelValue', (e.target as HTMLInputElement).value),
          });
      },
    }),
    ElDialog: defineComponent({
      name: 'ElDialog',
      props: {
        modelValue: Boolean,
        title: String,
        width: [String, Number],
      },
      emits: ['update:modelValue', 'closed'],
      setup(props, { slots, emit }) {
        return () =>
          props.modelValue
            ? h('div', { class: 'stub-ElDialog', role: 'dialog' }, [
                slots.default?.(),
                slots.footer?.(),
                h(
                  'button',
                  {
                    class: 'stub-dialog-close',
                    onClick: () => emit('update:modelValue', false),
                  },
                  'close',
                ),
              ])
            : null;
      },
    }),
    ElMessage: { error: (...args: unknown[]) => messageError(...args) },
  };
});

describe('CronZenPicker', () => {
  beforeEach(() => {
    messageError.mockClear();
  });

  it('应渲染输入框与默认选择按钮', () => {
    const wrapper = mount(CronZenPicker, {
      props: { modelValue: '* * * * * ? *', buttonText: '选择' },
    });
    expect(wrapper.find('.stub-ElInput').exists()).toBe(true);
    expect(wrapper.text()).toContain('选择');
  });

  it('打开弹窗后草稿应显示当前表达式', async () => {
    const wrapper = mount(CronZenPicker, {
      props: { modelValue: '0 15 10 * * ? *', debounceMs: 0 },
    });
    const btn = wrapper.findAll('button').find((b) => b.text() === '选择');
    await btn!.trigger('click');
    await nextTick();
    expect(wrapper.find('.stub-ElDialog').exists()).toBe(true);
    expect(wrapper.find('.cz-picker__draft').text()).toContain('0 15 10');
  });

  it('确定应校验并 emit 规范化表达式', async () => {
    const wrapper = mount(CronZenPicker, {
      props: { modelValue: '* * * * * ? *', debounceMs: 0 },
    });
    await wrapper.findAll('button').find((b) => b.text() === '选择')!.trigger('click');
    await nextTick();
    // 弹窗内 CronZen 改草稿：直接写 draft 通过底部确定
    const confirmBtn = wrapper.findAll('button').find((b) => b.text() === '确定');
    expect(confirmBtn).toBeTruthy();
    await confirmBtn!.trigger('click');
    await flushPromises();
    expect(wrapper.emitted('confirm')?.[0]?.[0]).toBe('* * * * * ? *');
    expect(wrapper.emitted('update:modelValue')?.flat().at(-1)).toBe('* * * * * ? *');
  });

  it('非法草稿点确定应提示错误且不关闭', async () => {
    const wrapper = mount(CronZenPicker, {
      props: { modelValue: '* * * * * ? *', debounceMs: 0 },
    });
    const vm = wrapper.vm as unknown as {
      open: () => void;
      setDraft: (v: string) => void;
    };
    vm.open();
    await nextTick();
    vm.setDraft('0 0 0 15 * 6 *');
    await nextTick();
    await wrapper.findAll('button').find((b) => b.text() === '确定')!.trigger('click');
    await flushPromises();
    expect(messageError).toHaveBeenCalled();
    expect(wrapper.emitted('confirm')).toBeUndefined();
  });

  it('取消关闭应 emit cancel', async () => {
    const wrapper = mount(CronZenPicker, {
      props: { modelValue: '* * * * * ? *' },
    });
    await wrapper.findAll('button').find((b) => b.text() === '选择')!.trigger('click');
    await nextTick();
    await wrapper.findAll('button').find((b) => b.text() === '取消')!.trigger('click');
    await nextTick();
    // visible 变为 false 触发 cancel
    expect(wrapper.emitted('cancel')?.length).toBeGreaterThan(0);
  });

  it('disabled 时不应打开弹窗', async () => {
    const wrapper = mount(CronZenPicker, {
      props: { modelValue: '* * * * * ? *', disabled: true },
    });
    const vm = wrapper.vm as unknown as { open: () => void };
    vm.open();
    await nextTick();
    expect(wrapper.find('.stub-ElDialog').exists()).toBe(false);
  });
});
