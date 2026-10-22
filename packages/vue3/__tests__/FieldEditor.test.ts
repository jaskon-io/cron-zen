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

  it('聚焦周期输入应自动切到 range 模式', async () => {
    const wrapper = mount(FieldEditor, {
      props: {
        name: 'minute',
        modelValue: { mode: 'every', raw: '*' },
      },
    });
    const numberInputs = wrapper.findAll('input[type="number"]');
    expect(numberInputs.length).toBeGreaterThan(0);
    await numberInputs[0].trigger('focus');
    const emitted = wrapper.emitted('update:modelValue');
    expect(emitted?.length).toBeGreaterThan(0);
    const last = emitted![emitted!.length - 1][0] as { mode: string; raw: string };
    expect(last.mode).toBe('range');
    expect(last.raw).toMatch(/^\d+-\d+$/);
  });

  it('日字段应包含工作日与最后一天', () => {
    const wrapper = mount(FieldEditor, {
      props: {
        name: 'day',
        modelValue: { mode: 'every', raw: '*' },
      },
    });
    expect(wrapper.text()).toContain('最近的那个工作日');
    expect(wrapper.text()).toContain('每月最后一天');
    expect(wrapper.text()).toContain('不指定');
  });

  it('年字段默认选项顺序：不指定在每年之前', () => {
    const wrapper = mount(FieldEditor, {
      props: {
        name: 'year',
        modelValue: { mode: 'unset', raw: '?' },
      },
    });
    const text = wrapper.text();
    expect(text.indexOf('不指定')).toBeLessThan(text.indexOf('每年'));
    expect(text).toContain('非必填');
  });


  it('选中每月最后一天应 emit last', async () => {
    const wrapper = mount(FieldEditor, {
      props: {
        name: 'day',
        modelValue: { mode: 'every', raw: '*' },
      },
    });
    const labels = wrapper.findAll('.cz-row');
    const lastRow = labels.find((l) => l.text().includes('每月最后一天'));
    expect(lastRow).toBeTruthy();
    const radio = lastRow!.find('input[type="radio"]');
    await radio.setValue(true);
    await radio.trigger('change');
    const last = wrapper.emitted('update:modelValue')!.at(-1)![0] as { mode: string; raw: string };
    expect(last).toMatchObject({ mode: 'last', raw: 'L' });
  });

  it('周「第 n 个」应 emit nth', async () => {
    const wrapper = mount(FieldEditor, {
      props: {
        name: 'week',
        modelValue: { mode: 'unset', raw: '?' },
      },
    });
    const row = wrapper.findAll('.cz-row').find((l) => l.text().includes('第') && l.text().includes('个'));
    expect(row).toBeTruthy();
    const radio = row!.find('input[type="radio"]');
    await radio.setValue(true);
    await radio.trigger('change');
    const last = wrapper.emitted('update:modelValue')!.at(-1)![0] as {
      mode: string;
      value: string;
      secondary: string;
    };
    expect(last.mode).toBe('nth');
    expect(last.value).toBe('2'); // 默认星期一
    expect(last.secondary).toBe('1');
  });

  it('every 模式下勾选格子应联动切到 list', async () => {
    const wrapper = mount(FieldEditor, {
      props: {
        name: 'hour',
        modelValue: { mode: 'every', raw: '*' },
      },
    });
    const box = wrapper.find('.cz-grid input[type="checkbox"]');
    await box.trigger('change');
    const last = wrapper.emitted('update:modelValue')!.at(-1)![0] as {
      mode: string;
      values?: string[];
    };
    expect(last.mode).toBe('list');
    expect(last.values?.length).toBeGreaterThan(0);
  });

  it('修改间隔数字应联动切到 step 并 emit', async () => {
    const wrapper = mount(FieldEditor, {
      props: {
        name: 'minute',
        modelValue: { mode: 'every', raw: '*' },
      },
    });
    const numberInputs = wrapper.findAll('input[type="number"]');
    // rangeStart, rangeEnd, stepBase, stepValue
    const stepBase = numberInputs[2];
    await stepBase.setValue(5);
    await stepBase.trigger('input');
    const last = wrapper.emitted('update:modelValue')!.at(-1)![0] as {
      mode: string;
      raw: string;
    };
    expect(last.mode).toBe('step');
    expect(last.raw).toMatch(/^5\//);
  });

  it('周字段无间隔行', () => {
    const wrapper = mount(FieldEditor, {
      props: {
        name: 'week',
        modelValue: { mode: 'unset', raw: '?' },
      },
    });
    expect(wrapper.text()).not.toContain('执行一次');
  });

  it('秒字段周期默认应为 1-2', async () => {
    const wrapper = mount(FieldEditor, {
      props: {
        name: 'second',
        modelValue: { mode: 'every', raw: '*' },
      },
    });
    const row = wrapper.findAll('.cz-row').find((l) => l.text().includes('周期'));
    const radio = row!.find('input[type="radio"]');
    await radio.setValue(true);
    await radio.trigger('change');
    const last = wrapper.emitted('update:modelValue')!.at(-1)![0] as { raw: string };
    expect(last.raw).toBe('1-2');
  });

  it('小时指定区应含 AM/PM 分组', () => {
    const wrapper = mount(FieldEditor, {
      props: {
        name: 'hour',
        modelValue: { mode: 'every', raw: '*' },
      },
    });
    expect(wrapper.text()).toContain('AM:');
    expect(wrapper.text()).toContain('PM:');
  });

  it('日工作日应 emit weekday', async () => {
    const wrapper = mount(FieldEditor, {
      props: {
        name: 'day',
        modelValue: { mode: 'every', raw: '*' },
      },
    });
    const row = wrapper.findAll('.cz-row').find((l) => l.text().includes('最近的那个工作日'));
    const radio = row!.find('input[type="radio"]');
    await radio.setValue(true);
    await radio.trigger('change');
    const last = wrapper.emitted('update:modelValue')!.at(-1)![0] as {
      mode: string;
      raw: string;
    };
    expect(last.mode).toBe('weekday');
    expect(last.raw).toBe('1W');
  });

  it('模式 radio 应共享 name 保证互斥', () => {
    const wrapper = mount(FieldEditor, {
      props: {
        name: 'minute',
        modelValue: { mode: 'every', raw: '*' },
      },
    });
    const names = wrapper
      .findAll('.cz-row input[type="radio"]')
      .map((r) => r.attributes('name'))
      .filter(Boolean);
    expect(names.length).toBeGreaterThan(1);
    expect(new Set(names).size).toBe(1);
  });
});


