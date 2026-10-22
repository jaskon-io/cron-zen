/**
 * @description CronZen 交互联动（对齐 cron.ren：点选项 / 改数值 / 勾选 → 表达式即时变）
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { nextTick, ref } from 'vue';
import CronZen from '../src/CronZen.vue';
import { useCronZen } from '../src/composables/useCronZen';

async function settle(wrapper?: ReturnType<typeof mount>): Promise<void> {
  await flushPromises();
  vi.runAllTimers();
  await nextTick();
  if (wrapper) await nextTick();
}

function mountZen(modelValue = '* * * * * ? *') {
  const model = ref(modelValue);
  const wrapper = mount(CronZen, {
    props: {
      modelValue: model.value,
      debounceMs: 0,
      showPreview: true,
      'onUpdate:modelValue': (v: string) => {
        model.value = v;
        void wrapper.setProps({ modelValue: v });
      },
    },
  });
  return wrapper;
}

async function goTab(wrapper: ReturnType<typeof mount>, index: number) {
  await wrapper.findAll('.cron-zen__tab')[index].trigger('click');
  await nextTick();
}

async function pickLabel(wrapper: ReturnType<typeof mount>, text: string) {
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
  expect(row, `未找到「${text}」`).toBeTruthy();
  const radio = (row as ReturnType<typeof wrapper.find>).find('input[type="radio"]');
  await radio.setValue(true);
  await radio.trigger('change');
  await settle(wrapper);
}

function exprOf(wrapper: ReturnType<typeof mount>): string {
  return (
    (wrapper.emitted('update:modelValue')?.flat().at(-1) as string) ??
    wrapper.find('.cron-zen__expr').text()
  );
}

function parts(wrapper: ReturnType<typeof mount>): string[] {
  return exprOf(wrapper).trim().split(/\s+/);
}

describe('CronZen 交互联动（对标 cron.ren）', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  describe('秒选项（约十余用例）', () => {
    it.each([
      ['每秒', 0, '*'],
      ['周期', 0, '1-2'],
      ['间隔', 0, '0/1'],
      ['指定', 0, /^\d+(,\d+)*$/],
    ] as const)('点「%s」→ 秒段变', async (label, idx, expectPart) => {
      const wrapper = mountZen();
      await pickLabel(wrapper, label);
      const part = parts(wrapper)[idx];
      if (typeof expectPart === 'string') expect(part).toBe(expectPart);
      else expect(part).toMatch(expectPart);
    });

    it('改周期终点应联动表达式', async () => {
      const wrapper = mountZen();
      await pickLabel(wrapper, '周期');
      const nums = wrapper.findAll('input[type="number"]');
      await nums[1].setValue(10);
      await nums[1].trigger('input');
      await settle(wrapper);
      expect(parts(wrapper)[0]).toBe('1-10');
    });

    it('改间隔步长应联动为 0/5', async () => {
      const wrapper = mountZen();
      await pickLabel(wrapper, '间隔');
      const nums = wrapper.findAll('input[type="number"]');
      // 间隔行：起点 + 步长
      const stepInput = nums[nums.length - 1];
      await stepInput.setValue(5);
      await stepInput.trigger('input');
      await settle(wrapper);
      expect(parts(wrapper)[0]).toBe('0/5');
    });

    it('指定勾选 0,15,30 应联动', async () => {
      const wrapper = mountZen();
      await pickLabel(wrapper, '指定');
      const checks = wrapper.findAll('.cz-grid input[type="checkbox"]');
      // 指定默认勾 0；再勾 15、30（按 DOM checked 态同步）
      for (const i of [15, 30]) {
        await checks[i].setValue(true);
        await checks[i].trigger('change');
      }
      await settle(wrapper);
      expect(parts(wrapper)[0]).toBe('0,15,30');
    });

    it('聚焦间隔输入应自动切到间隔模式', async () => {
      const wrapper = mountZen();
      const nums = wrapper.findAll('input[type="number"]');
      // 间隔起点（每秒页：周期两个 + 间隔两个）
      await nums[2].trigger('focus');
      await settle(wrapper);
      expect(parts(wrapper)[0]).toMatch(/^\d+\/\d+$/);
    });

    it('空 v-model 首次点间隔应写出表达式', async () => {
      const model = ref('');
      const wrapper = mount(CronZen, {
        props: {
          modelValue: model.value,
          debounceMs: 0,
          showPreview: false,
          'onUpdate:modelValue': (v: string) => {
            model.value = v;
            void wrapper.setProps({ modelValue: v });
          },
        },
      });
      await pickLabel(wrapper, '间隔');
      expect(model.value).toMatch(/^0\/1 /);
      // 年不指定时为 6 段（对齐 cron.ren）
      expect(model.value.split(/\s+/)).toHaveLength(6);
    });

    it('从指定切回每秒应恢复 *', async () => {
      const wrapper = mountZen();
      await pickLabel(wrapper, '指定');
      await pickLabel(wrapper, '每秒');
      expect(parts(wrapper)[0]).toBe('*');
    });
  });

  describe('分钟选项', () => {
    it.each([
      ['每分钟', '*'],
      ['周期', '1-2'],
      ['间隔', '0/1'],
      ['指定', /^\d/],
    ] as const)('点「%s」', async (label, expectPart) => {
      const wrapper = mountZen();
      await goTab(wrapper, 1);
      await pickLabel(wrapper, label);
      const part = parts(wrapper)[1];
      if (typeof expectPart === 'string') expect(part).toBe(expectPart);
      else expect(part).toMatch(expectPart);
    });

    it('间隔改为 */5 观感：起点 0 步长 5 → 0/5', async () => {
      const wrapper = mountZen();
      await goTab(wrapper, 1);
      await pickLabel(wrapper, '间隔');
      const nums = wrapper.findAll('input[type="number"]');
      await nums[nums.length - 1].setValue(5);
      await nums[nums.length - 1].trigger('input');
      await settle(wrapper);
      expect(parts(wrapper)[1]).toBe('0/5');
    });

    it('指定 1,11 后预览分钟段应为 1,11', async () => {
      const wrapper = mountZen();
      await goTab(wrapper, 1);
      await pickLabel(wrapper, '指定');
      const checks = wrapper.findAll('.cz-grid input[type="checkbox"]');
      // 默认 0 → 勾 1、11 → 再取消 0
      await checks[1].setValue(true);
      await checks[1].trigger('change');
      await checks[11].setValue(true);
      await checks[11].trigger('change');
      await checks[0].setValue(false);
      await checks[0].trigger('change');
      await settle(wrapper);
      expect(parts(wrapper)[1]).toBe('1,11');
    });
  });

  describe('小时选项', () => {
    it.each([['每小时'], ['周期'], ['间隔'], ['指定']])('点「%s」可切换', async (label) => {
      const wrapper = mountZen();
      await goTab(wrapper, 2);
      await pickLabel(wrapper, label);
      expect(exprOf(wrapper).length).toBeGreaterThan(5);
    });

    it('周期 9-18 应对齐 cron.ren 工作时段', async () => {
      const wrapper = mountZen();
      await goTab(wrapper, 2);
      await pickLabel(wrapper, '周期');
      const nums = wrapper.findAll('input[type="number"]');
      // 先拉大终点再改起点，避免中间态起>止被排序回写干扰（本地应保留用户输入）
      await nums[1].setValue(18);
      await nums[1].trigger('input');
      await nums[0].setValue(9);
      await nums[0].trigger('input');
      await settle(wrapper);
      expect(parts(wrapper)[2]).toBe('9-18');
    });

    it('指定 AM/PM 格子存在', async () => {
      const wrapper = mountZen();
      await goTab(wrapper, 2);
      expect(wrapper.text()).toContain('AM:');
      expect(wrapper.text()).toContain('PM:');
      await pickLabel(wrapper, '指定');
      expect(wrapper.findAll('.cz-grid input[type="checkbox"]').length).toBe(24);
    });
  });

  describe('日选项 + 日周互斥', () => {
    it.each([
      ['每日', '*'],
      ['不指定', '*'], // 双方?时日规范为*
      ['周期', '1-2'],
      ['间隔', '1/1'],
      ['最近的那个工作日', /^\d+W$/],
      ['每月最后一天', 'L'],
      ['指定', /^\d/],
    ] as const)('点「%s」→ 日=%s 且周=?', async (label, expectDay) => {
      const wrapper = mountZen();
      await goTab(wrapper, 3);
      await pickLabel(wrapper, label);
      const p = parts(wrapper);
      if (typeof expectDay === 'string') expect(p[3]).toBe(expectDay);
      else expect(p[3]).toMatch(expectDay);
      if (label !== '每日' && label !== '不指定') {
        expect(p[5]).toBe('?');
      }
    });

    it('配置日具体值后切到周应见互斥提示', async () => {
      const wrapper = mountZen();
      await goTab(wrapper, 3);
      await pickLabel(wrapper, '每月最后一天');
      await goTab(wrapper, 5);
      expect(wrapper.text()).toContain('日周互斥');
    });
  });

  describe('月选项', () => {
    it.each([
      ['每月', '*'],
      ['周期', '1-2'],
      ['间隔', '1/1'],
      ['指定', /^\d/],
    ] as const)('点「%s」', async (label, expectPart) => {
      const wrapper = mountZen();
      await goTab(wrapper, 4);
      await pickLabel(wrapper, label);
      const part = parts(wrapper)[4];
      if (typeof expectPart === 'string') expect(part).toBe(expectPart);
      else expect(part).toMatch(expectPart);
    });

    it('指定季度 1,4,7,10', async () => {
      const wrapper = mountZen();
      await goTab(wrapper, 4);
      await pickLabel(wrapper, '指定');
      const checks = wrapper.findAll('.cz-grid input[type="checkbox"]');
      // 月默认勾 1；再勾 4/7/10
      for (const m of [4, 7, 10]) {
        await checks[m - 1].setValue(true);
        await checks[m - 1].trigger('change');
      }
      await settle(wrapper);
      expect(parts(wrapper)[4]).toBe('1,4,7,10');
    });
  });

  describe('周选项 + 互斥', () => {
    it.each([['每周'], ['不指定'], ['周期'], ['指定']])('点「%s」', async (label) => {
      const wrapper = mountZen();
      await goTab(wrapper, 5);
      await pickLabel(wrapper, label);
      expect(parts(wrapper)).toHaveLength(7);
    });

    it('点本月最后一个 → 日=? 周=nL', async () => {
      const wrapper = mountZen();
      await goTab(wrapper, 5);
      await pickLabel(wrapper, '本月最后一个');
      const p = parts(wrapper);
      expect(p[3]).toBe('?');
      expect(p[5]).toMatch(/^\d+L$/);
    });

    it('点第 n 个 → #', async () => {
      const wrapper = mountZen();
      await goTab(wrapper, 5);
      const row = wrapper
        .findAll('.cz-row')
        .find((l) => l.text().includes('第') && l.text().includes('个'));
      const radio = row!.find('input[type="radio"]');
      await radio.setValue(true);
      await radio.trigger('change');
      await settle(wrapper);
      expect(parts(wrapper)[5]).toMatch(/^\d+#\d+$/);
      expect(parts(wrapper)[3]).toBe('?');
    });

    it('切换 abbr 写法后周段变英文', async () => {
      const wrapper = mountZen();
      await goTab(wrapper, 5);
      await pickLabel(wrapper, '指定');
      const checks = wrapper.findAll('.cz-grid input[type="checkbox"]');
      // 清空后勾星期一（UI 顺序周一在前，值为 2）
      for (const c of checks) {
        if ((c.element as HTMLInputElement).checked) {
          await c.setValue(false);
          await c.trigger('change');
        }
      }
      // 星期一通常是第一个格子（QUARTZ_WEEK_UI_ORDER 周一优先）
      await checks[0].setValue(true);
      await checks[0].trigger('change');
      await settle(wrapper);
      const fmtRadios = wrapper.findAll('.cz-week-format input[type="radio"]');
      await fmtRadios[1].setValue(true);
      await fmtRadios[1].trigger('change');
      await settle(wrapper);
      expect(parts(wrapper)[5]).toMatch(/^[A-Z]{3}(,[A-Z]{3})*$/);
    });
  });

  describe('年选项', () => {
    it.each([
      ['不指定', 6],
      ['每年', 7],
      ['周期', 7],
      ['间隔', 7],
      ['指定', 7],
    ] as const)('点「%s」→ %i 段', async (label, len) => {
      const wrapper = mountZen();
      await goTab(wrapper, 6);
      await pickLabel(wrapper, label);
      expect(parts(wrapper)).toHaveLength(len);
    });

    it('不指定 → 省略年段（对齐 cron.ren 非必填，不补默认 *）', async () => {
      const wrapper = mountZen('0 0 0 * * ? 2026');
      await settle(wrapper);
      await goTab(wrapper, 6);
      await pickLabel(wrapper, '不指定');
      const p = parts(wrapper);
      expect(p).toHaveLength(6);
      expect(p.join(' ')).toBe('0 0 0 * * ?');
    });
  });

  describe('Tab / 回显 / 跨字段不丢状态', () => {
    it('秒改间隔后再切分钟再切回，秒仍为间隔', async () => {
      const wrapper = mountZen();
      await pickLabel(wrapper, '间隔');
      const before = parts(wrapper)[0];
      await goTab(wrapper, 1);
      await goTab(wrapper, 0);
      expect(parts(wrapper)[0]).toBe(before);
      const radios = wrapper.findAll('.cz-row input[type="radio"]');
      // 间隔是第 3 个 radio（每秒/周期/间隔/指定）
      expect((radios[2].element as HTMLInputElement).checked).toBe(true);
    });

    it('预览字段点击应切 Tab', async () => {
      const wrapper = mountZen();
      await wrapper.findAll('.cron-zen__field-val')[2].trigger('click');
      await nextTick();
      expect(wrapper.findAll('.cron-zen__tab')[2].classes()).toContain('is-active');
      expect(wrapper.text()).toContain('每小时');
    });

    it('加载 0 */5 应落在分钟并回显间隔', async () => {
      const wrapper = mountZen('0 */5 * * * ? *');
      await settle(wrapper);
      expect(wrapper.findAll('.cron-zen__tab')[1].classes()).toContain('is-active');
      expect(wrapper.text()).toContain('间隔');
    });

    it('多字段连续配置：秒0 + 分0/5 + 时9-18', async () => {
      const model = ref('* * * * * ? *');
      const { updateField, expression } = useCronZen({ modelValue: model, debounceMs: 0 });
      updateField('second', { mode: 'specific', raw: '0', value: '0' });
      updateField('minute', { mode: 'step', raw: '0/5', value: '0', secondary: '5' });
      updateField('hour', { mode: 'range', raw: '9-18', value: '9', secondary: '18' });
      expect(expression.value).toBe('0 0/5 9-18 * * ? *');
      expect(model.value).toBe('0 0/5 9-18 * * ? *');
    });
  });
});
