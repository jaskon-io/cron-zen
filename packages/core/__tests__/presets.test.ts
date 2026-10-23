import { describe, it, expect } from 'vitest';
import {
  getCronPreset,
  getCronPresets,
  listCronPresetDefs,
  parseCron,
} from '../src';

describe('presets', () => {
  it('listCronPresetDefs 应含常用模板且表达式可解析', () => {
    const defs = listCronPresetDefs();
    expect(defs.length).toBeGreaterThanOrEqual(8);
    for (const d of defs) {
      const res = parseCron(d.expression);
      expect(res.success, d.id).toBe(true);
    }
  });

  it('getCronPresets 中英文标签', () => {
    const zh = getCronPresets('zh-CN');
    const en = getCronPresets('en-US');
    expect(zh.find((p) => p.id === 'every-minute')?.label).toBe('每分钟');
    expect(en.find((p) => p.id === 'every-minute')?.label).toBe('Every minute');
    expect(zh.find((p) => p.id === 'weekdays-9am')?.expression).toBe('0 0 9 ? * 2-6');
  });

  it('getCronPreset 按 id 取值', () => {
    expect(getCronPreset('every-hour')?.expression).toBe('0 0 * * * ?');
    expect(getCronPreset('nope')).toBeUndefined();
  });
});
