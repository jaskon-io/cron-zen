import { describe, it, expect } from 'vitest';
import { getCronTabs } from '../src/tabs';

describe('getCronTabs', () => {
  it('应返回 7 个字段 Tab', () => {
    const tabs = getCronTabs();
    expect(tabs).toHaveLength(7);
    expect(tabs[0]).toMatchObject({ name: 'second', label: '秒', min: 0, max: 59 });
    expect(tabs[1].label).toBe('分钟');
    expect(tabs[2].label).toBe('小时');
    expect(tabs[3].name).toBe('day');
    expect(tabs[6]).toMatchObject({ name: 'year', min: 1970, max: 2099 });
  });
});
