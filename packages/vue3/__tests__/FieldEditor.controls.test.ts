/**
 * @description FieldEditor 行内控件联动 / 回显（对齐 cron.ren：改数字即切模式并上抛）
 */
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import FieldEditor from '../src/components/FieldEditor.vue';
import type { CronFieldName, CronFieldState } from '@cron-zen/core';

function mountField(name: CronFieldName, modelValue: CronFieldState) {
  return mount(FieldEditor, { props: { name, modelValue } });
}

function lastEmit(wrapper: ReturnType<typeof mount>): CronFieldState {
  return wrapper.emitted('update:modelValue')!.at(-1)![0] as CronFieldState;
}

describe('FieldEditor 控件联动', () => {
  describe('秒', () => {
    it.each([
      [{ mode: 'every' as const, raw: '*' }, 'every'],
      [{ mode: 'range' as const, raw: '5-10', value: '5', secondary: '10' }, 'range'],
      [{ mode: 'step' as const, raw: '0/5', value: '0', secondary: '5' }, 'step'],
      [
        {
          mode: 'list' as const,
          raw: '0,15',
          value: '0,15',
          values: ['0', '15'],
        },
        'list',
      ],
    ])('回显 %j → radio 选中', async (model, mode) => {
      const wrapper = mountField('second', model);
      const radios = wrapper.findAll('.cz-row input[type="radio"]');
      const idx = mode === 'every' ? 0 : mode === 'range' ? 1 : mode === 'step' ? 2 : 3;
      expect((radios[idx].element as HTMLInputElement).checked).toBe(true);
    });

    it('step 回显应填入起点与步长', () => {
      const wrapper = mountField('second', {
        mode: 'step',
        raw: '10/15',
        value: '10',
        secondary: '15',
      });
      const nums = wrapper.findAll('input[type="number"]');
      expect(Number((nums[2].element as HTMLInputElement).value)).toBe(10);
      expect(Number((nums[3].element as HTMLInputElement).value)).toBe(15);
    });

    it('改周期数字应 emit range（起>止保留原序，对齐 cron.ren）', async () => {
      const wrapper = mountField('second', { mode: 'every', raw: '*' });
      const nums = wrapper.findAll('input[type="number"]');
      // 默认终点 2，起点改 3 → 输出 3-2（不强制排序）
      await nums[0].setValue(3);
      await nums[0].trigger('input');
      expect(lastEmit(wrapper).mode).toBe('range');
      expect(lastEmit(wrapper).raw).toBe('3-2');
      // 再把终点调到 10
      await nums[1].setValue(10);
      await nums[1].trigger('input');
      expect(lastEmit(wrapper).raw).toBe('3-10');
    });

    it('改间隔数字应 emit step', async () => {
      const wrapper = mountField('second', { mode: 'every', raw: '*' });
      const nums = wrapper.findAll('input[type="number"]');
      await nums[3].setValue(7);
      await nums[3].trigger('input');
      expect(lastEmit(wrapper).mode).toBe('step');
      expect(lastEmit(wrapper).secondary).toBe('7');
    });
  });

  describe('分钟', () => {
    it('*/5 回显：起点按 min=0，步长 5', () => {
      const wrapper = mountField('minute', {
        mode: 'step',
        raw: '*/5',
        value: '*',
        secondary: '5',
      });
      const nums = wrapper.findAll('input[type="number"]');
      expect(Number((nums[2].element as HTMLInputElement).value)).toBe(0);
      expect(Number((nums[3].element as HTMLInputElement).value)).toBe(5);
      const radios = wrapper.findAll('.cz-row input[type="radio"]');
      expect((radios[2].element as HTMLInputElement).checked).toBe(true);
    });

    it('list 1,11 格子应勾选', () => {
      const wrapper = mountField('minute', {
        mode: 'list',
        raw: '1,11',
        value: '1,11',
        values: ['1', '11'],
      });
      const active = wrapper
        .findAll('.cz-grid__check')
        .filter((l) => l.classes().includes('is-active'))
        .map((l) => l.text());
      expect(active).toEqual(expect.arrayContaining(['01', '11']));
    });
  });

  describe('日', () => {
    it('weekday 15W 回显数字 15', () => {
      const wrapper = mountField('day', {
        mode: 'weekday',
        raw: '15W',
        value: '15',
      });
      const nums = wrapper.findAll('input[type="number"]');
      const near = nums.find((n) => Number((n.element as HTMLInputElement).value) === 15);
      expect(near).toBeTruthy();
    });

    it('改工作日数字应 emit weekday', async () => {
      const wrapper = mountField('day', { mode: 'every', raw: '*' });
      const row = wrapper.findAll('.cz-row').find((l) => l.text().includes('最近的那个工作日'));
      const input = row!.find('input[type="number"]');
      await input.setValue(20);
      await input.trigger('input');
      expect(lastEmit(wrapper)).toMatchObject({ mode: 'weekday', raw: '20W' });
    });
  });

  describe('周', () => {
    it('nth 6#2 回显', () => {
      const wrapper = mountField('week', {
        mode: 'nth',
        raw: '6#2',
        value: '6',
        secondary: '2',
      });
      const radios = wrapper.findAll('.cz-row input[type="radio"]');
      const nthChecked = radios.some((r) => {
        const row = r.element.closest('.cz-row');
        return (
          (r.element as HTMLInputElement).checked &&
          !!row &&
          row.textContent?.includes('第') &&
          row.textContent?.includes('个')
        );
      });
      expect(nthChecked).toBe(true);
    });

    it('last 2L 回显', () => {
      const wrapper = mountField('week', { mode: 'last', raw: '2L', value: '2' });
      const row = wrapper.findAll('.cz-row').find((l) => l.text().includes('本月最后一个'));
      expect((row!.find('input[type="radio"]').element as HTMLInputElement).checked).toBe(true);
    });

    it('range 周下拉周一-周五', async () => {
      const wrapper = mountField('week', {
        mode: 'range',
        raw: '2-6',
        value: '2',
        secondary: '6',
      });
      const selects = wrapper.findAll('select');
      expect(selects.length).toBeGreaterThanOrEqual(2);
      expect(Number((selects[0].element as HTMLSelectElement).value)).toBe(2);
      expect(Number((selects[1].element as HTMLSelectElement).value)).toBe(6);
    });
  });

  describe('年', () => {
    it('不指定 radio 默认选中', () => {
      const wrapper = mountField('year', { mode: 'unset', raw: '?' });
      const radios = wrapper.findAll('.cz-row input[type="radio"]');
      expect((radios[0].element as HTMLInputElement).checked).toBe(true);
    });

    it('range 当年回显', () => {
      const y = new Date().getFullYear();
      const wrapper = mountField('year', {
        mode: 'range',
        raw: `${y}-${y + 1}`,
        value: String(y),
        secondary: String(y + 1),
      });
      const nums = wrapper.findAll('input[type="number"]');
      expect(Number((nums[0].element as HTMLInputElement).value)).toBe(y);
      expect(Number((nums[1].element as HTMLInputElement).value)).toBe(y + 1);
    });
  });

  describe('props 变更回显不串值', () => {
    it('从 step 切到 every 再切回 list 应清勾选默认', async () => {
      const wrapper = mountField('second', {
        mode: 'step',
        raw: '0/5',
        value: '0',
        secondary: '5',
      });
      await wrapper.setProps({
        modelValue: { mode: 'every', raw: '*' },
      });
      await wrapper.setProps({
        modelValue: {
          mode: 'list',
          raw: '3',
          value: '3',
          values: ['3'],
        },
      });
      const active = wrapper
        .findAll('.cz-grid__check')
        .filter((l) => l.classes().includes('is-active'))
        .map((l) => l.text());
      expect(active).toEqual(['03']);
    });
  });
});
