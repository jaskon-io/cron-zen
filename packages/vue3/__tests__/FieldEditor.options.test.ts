/**
 * @description FieldEditor 各字段 UI 选项点击联动（对齐 cron.ren 单选行）
 */
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import FieldEditor from '../src/components/FieldEditor.vue';
import type { CronFieldName, CronFieldState } from '@cron-zen/core';

function mountField(name: CronFieldName, modelValue: CronFieldState) {
  return mount(FieldEditor, { props: { name, modelValue } });
}

async function pickRowByText(wrapper: ReturnType<typeof mount>, text: string) {
  // 「指定」是「不指定」的子串，需精确匹配 strong / 指定行头
  let row =
    text === '指定'
      ? wrapper.find('.cz-row__head')
      : wrapper.findAll('.cz-row').find((l) => {
          const strong = l.find('strong');
          if (strong.exists() && strong.text() === text) return true;
          return l.text().includes(text) && !l.text().includes(`不${text}`);
        });
  if (text !== '指定' && !row) {
    row = wrapper.findAll('.cz-row').find((l) => l.text().includes(text));
  }
  expect(row && (row as { exists?: () => boolean }).exists?.() !== false, `未找到含「${text}」的行`).toBeTruthy();
  const el = row as ReturnType<typeof wrapper.find>;
  const radio = el.find('input[type="radio"]');
  await radio.setValue(true);
  await radio.trigger('change');
  return wrapper.emitted('update:modelValue')!.at(-1)![0] as CronFieldState;
}

describe('FieldEditor 选项联动', () => {
  describe('秒', () => {
    it.each([
      ['每秒', 'every', '*'],
      ['周期', 'range', '1-2'],
      ['间隔', 'step', /^0\/1$/],
      ['指定', 'list', /./],
    ])('点「%s」应 emit mode=%s', async (label, mode, raw) => {
      const wrapper = mountField('second', { mode: 'every', raw: '*' });
      const last = await pickRowByText(wrapper, label);
      expect(last.mode).toBe(mode === 'list' ? 'list' : mode);
      if (typeof raw === 'string') expect(last.raw).toBe(raw);
      else expect(last.raw).toMatch(raw);
    });
  });

  describe('分钟', () => {
    it.each([
      ['每分钟', 'every'],
      ['周期', 'range'],
      ['间隔', 'step'],
      ['指定', 'list'],
    ])('点「%s」', async (label, mode) => {
      const wrapper = mountField('minute', { mode: 'every', raw: '*' });
      const last = await pickRowByText(wrapper, label);
      expect(last.mode === mode || (mode === 'list' && last.mode === 'list')).toBe(true);
    });
  });

  describe('小时', () => {
    it('默认文案含每小时与 AM/PM', () => {
      const wrapper = mountField('hour', { mode: 'every', raw: '*' });
      expect(wrapper.text()).toContain('每小时');
      expect(wrapper.text()).toContain('AM:');
      expect(wrapper.text()).toContain('PM:');
    });

    it.each([['周期'], ['间隔'], ['指定']])('点「%s」可切换', async (label) => {
      const wrapper = mountField('hour', { mode: 'every', raw: '*' });
      const last = await pickRowByText(wrapper, label);
      expect(last.mode).not.toBe('every');
    });
  });

  describe('日', () => {
    it.each([
      ['每日', 'every'],
      ['不指定', 'unset'],
      ['周期', 'range'],
      ['间隔', 'step'],
      ['最近的那个工作日', 'weekday'],
      ['每月最后一天', 'last'],
      ['本月最后一个工作日', 'lastWeekday'],
      ['指定', 'list'],
    ])('点「%s」→ %s', async (label, mode) => {
      const wrapper = mountField('day', { mode: 'every', raw: '*' });
      const last = await pickRowByText(wrapper, label);
      expect(last.mode).toBe(mode);
    });

    it('点本月最后一个工作日 → raw=LW', async () => {
      const wrapper = mountField('day', { mode: 'every', raw: '*' });
      const last = await pickRowByText(wrapper, '本月最后一个工作日');
      expect(last).toMatchObject({ mode: 'lastWeekday', raw: 'LW' });
    });
  });

  describe('月', () => {
    it.each([
      ['每月', 'every'],
      ['周期', 'range'],
      ['间隔', 'step'],
      ['指定', 'list'],
    ])('点「%s」→ %s', async (label, mode) => {
      const wrapper = mountField('month', { mode: 'every', raw: '*' });
      const last = await pickRowByText(wrapper, label);
      expect(last.mode).toBe(mode);
    });

    it('指定格子应显示 1月–12月 标签', async () => {
      const wrapper = mountField('month', { mode: 'every', raw: '*' });
      await pickRowByText(wrapper, '指定');
      const text = wrapper.text();
      expect(text).toContain('1月');
      expect(text).toContain('12月');
      expect(text).toContain('6月');
    });
  });

  describe('周', () => {
    it.each([
      ['每周', 'every'],
      ['不指定', 'unset'],
      ['周期', 'range'],
      ['指定', 'list'],
    ])('点「%s」→ %s', async (label, mode) => {
      const wrapper = mountField('week', { mode: 'unset', raw: '?' });
      const last = await pickRowByText(wrapper, label);
      expect(last.mode).toBe(mode);
    });

    it('点第 n 个 → nth', async () => {
      const wrapper = mountField('week', { mode: 'unset', raw: '?' });
      const row = wrapper
        .findAll('.cz-row')
        .find((l) => l.text().includes('第') && l.text().includes('个'));
      const radio = row!.find('input[type="radio"]');
      await radio.setValue(true);
      await radio.trigger('change');
      const last = wrapper.emitted('update:modelValue')!.at(-1)![0] as CronFieldState;
      expect(last.mode).toBe('nth');
      expect(last.raw).toMatch(/^\d+#\d+$/);
    });

    it('点本月最后一个 → last', async () => {
      const wrapper = mountField('week', { mode: 'unset', raw: '?' });
      const last = await pickRowByText(wrapper, '本月最后一个');
      expect(last.mode).toBe('last');
      expect(last.raw).toMatch(/^\d+L$/);
    });

    it('无间隔选项', () => {
      const wrapper = mountField('week', { mode: 'unset', raw: '?' });
      expect(wrapper.text()).not.toContain('执行一次');
    });
  });

  describe('年', () => {
    it('不指定在每年之前且默认文案含非必填', () => {
      const wrapper = mountField('year', { mode: 'unset', raw: '?' });
      const text = wrapper.text();
      expect(text.indexOf('不指定')).toBeLessThan(text.indexOf('每年'));
      expect(text).toContain('非必填');
    });

    it.each([
      ['不指定', 'unset'],
      ['每年', 'every'],
      ['周期', 'range'],
      ['间隔', 'step'],
      ['指定', 'list'],
    ])('点「%s」→ %s', async (label, mode) => {
      const wrapper = mountField('year', { mode: 'unset', raw: '?' });
      const last = await pickRowByText(wrapper, label);
      expect(last.mode).toBe(mode);
    });
  });

  describe('disabled', () => {
    it('禁用时点击不应 emit', async () => {
      const wrapper = mount(FieldEditor, {
        props: {
          name: 'second',
          modelValue: { mode: 'every', raw: '*' },
          disabled: true,
        },
      });
      const radio = wrapper.findAll('input[type="radio"]')[1];
      await radio.setValue(true);
      await radio.trigger('change');
      expect(wrapper.emitted('update:modelValue')).toBeUndefined();
    });
  });
});
