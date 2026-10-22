import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { useCronZen } from '../src/composables/useCronZen';
import FieldEditor from '../src/components/FieldEditor.vue';

describe('loadExpression 周写法探测（对标 cron.ren 6L）', () => {
  it('加载 6L 应保持 number，表达式不被改写为 FRIL', () => {
    const { loadExpression, weekFormat, expression, state } = useCronZen({ debounceMs: 0 });
    loadExpression('0 15 10 ? * 6L 2024-2030');
    expect(weekFormat.value).toBe('number');
    expect(expression.value).toBe('0 15 10 ? * 6L 2024-2030');
    expect(state.value.week).toMatchObject({ mode: 'last', value: '6' });
  });

  it('加载 FRIL 应为 abbr 并保持 FRIL', () => {
    const { loadExpression, weekFormat, expression } = useCronZen({ debounceMs: 0 });
    loadExpression('0 15 10 ? * FRIL 2024-2030');
    expect(weekFormat.value).toBe('abbr');
    expect(expression.value).toBe('0 15 10 ? * FRIL 2024-2030');
  });

  it('加载 MON-FRI 应为 abbr', () => {
    const { loadExpression, weekFormat, expression } = useCronZen({ debounceMs: 0 });
    loadExpression('0 0 9-18 ? * MON-FRI');
    expect(weekFormat.value).toBe('abbr');
    expect(expression.value.split(/\s+/)[5]).toBe('MON-FRI');
  });
});

describe('周「指定」默认勾选（对标 cron.ren）', () => {
  it('点指定应默认勾星期一（Quartz 2）', async () => {
    const wrapper = mount(FieldEditor, {
      props: { name: 'week', modelValue: { mode: 'unset', raw: '?' } },
    });
    const head = wrapper.find('.cz-row__head input[type="radio"]');
    await head.setValue(true);
    await head.trigger('change');
    const last = wrapper.emitted('update:modelValue')!.at(-1)![0] as {
      values?: string[];
      raw?: string;
    };
    expect(last.values).toEqual(['2']);
    expect(last.raw).toBe('2');
  });
});
