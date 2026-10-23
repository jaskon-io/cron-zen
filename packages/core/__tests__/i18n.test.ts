import { describe, it, expect } from 'vitest';
import {
  describeCron,
  describeField,
  getCronTabs,
  getUiMessages,
  resolveLocale,
  listLocales,
  createDefaultCronState,
} from '../src';
import type { CronState } from '../src';

describe('resolveLocale / listLocales', () => {
  it('默认 zh-CN', () => {
    expect(resolveLocale().code).toBe('zh-CN');
  });

  it('en / en-US 映射到英文', () => {
    expect(resolveLocale('en').code).toBe('en-US');
    expect(resolveLocale('en-US').code).toBe('en-US');
  });

  it('listLocales 含 zh-CN 与 en-US', () => {
    expect(listLocales()).toEqual(['zh-CN', 'en-US']);
  });
});

describe('describeCron locale', () => {
  it('默认中文每天', () => {
    expect(describeCron(createDefaultCronState())).toBe('每天');
  });

  it('en-US Every day', () => {
    expect(describeCron(createDefaultCronState(), { locale: 'en-US' })).toBe('Every day');
  });

  it('周区间中英文', () => {
    const state: CronState = {
      ...createDefaultCronState(),
      day: { mode: 'unset', raw: '?' },
      week: { mode: 'range', raw: '2-6', value: '2', secondary: '6' },
    };
    expect(describeCron(state)).toContain('周一');
    expect(describeCron(state)).toContain('周五');
    const en = describeCron(state, { locale: 'en-US' });
    expect(en).toContain('Monday');
    expect(en).toContain('Friday');
  });
});

describe('describeField 兼容旧中文 label', () => {
  it('小时 specific 仍可用中文 label', () => {
    expect(
      describeField('小时', { mode: 'specific', raw: '2', value: '2' }),
    ).toContain('2');
  });

  it('推荐用字段名 + locale', () => {
    expect(
      describeField('hour', { mode: 'specific', raw: '2', value: '2' }, { locale: 'en-US' }),
    ).toMatch(/at 2 hour/);
  });
});

describe('getCronTabs locale', () => {
  it('默认中文 Tab', () => {
    expect(getCronTabs()[0].label).toBe('秒');
  });

  it('en-US Tab', () => {
    expect(getCronTabs('en-US')[0].label).toBe('Second');
    expect(getCronTabs('en-US')[2].label).toBe('Hour');
  });
});

describe('getUiMessages FieldEditor', () => {
  it('默认中文：每秒 / 周期 / 间隔', () => {
    const ui = getUiMessages();
    expect(ui.every(ui.editorUnits.second)).toBe('每秒');
    expect(ui.range).toBe('周期');
    expect(ui.step).toBe('间隔');
    expect(ui.specific).toBe('指定');
    expect(ui.mutexDayOccupied).toContain('日周互斥');
  });

  it('en-US：Every second / Range / Interval', () => {
    const ui = getUiMessages('en-US');
    expect(ui.every(ui.editorUnits.second)).toBe('Every second');
    expect(ui.range).toBe('Range');
    expect(ui.step).toBe('Interval');
    expect(ui.specific).toBe('Specific');
    expect(ui.copy).toBe('Copy');
    expect(ui.weekDayEditor[2]).toBe('Monday');
    expect(ui.monthEditor[1]).toBe('Jan');
    expect(ui.mutexDayOccupied).toMatch(/mutex/i);
  });

  it('自定义包缺 ui 时应回退内置', () => {
    const partial = {
      ...resolveLocale('zh-CN'),
      ui: undefined as unknown as ReturnType<typeof getUiMessages>,
    };
    delete (partial as { ui?: unknown }).ui;
    expect(resolveLocale(partial).ui.every('秒')).toBe('每秒');
  });
});
