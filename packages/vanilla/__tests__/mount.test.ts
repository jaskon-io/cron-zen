import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mountCronZen } from '../src/mount';

describe('mountCronZen', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="app"></div>';
    vi.useFakeTimers();
  });
  afterEach(() => {
    document.body.innerHTML = '';
    vi.useRealTimers();
  });

  it('应挂载到容器并显示 Tab', () => {
    const api = mountCronZen('#app', { value: '* * * * * ? *', debounceMs: 0 });
    expect(document.querySelectorAll('.cron-zen__tab').length).toBeGreaterThan(5);
    expect(document.querySelector('.cron-zen__expr')?.textContent).toBe('* * * * * ? *');
    api.destroy();
  });

  it('空 value 显示占位文案', () => {
    const api = mountCronZen('#app', { value: '', debounceMs: 0 });
    expect(document.querySelector('.cron-zen__expr')?.textContent).toMatch(/编辑后生成/);
    api.destroy();
  });

  it('点击 Tab 应切换激活态', () => {
    const api = mountCronZen('#app', { value: '* * * * * ?', debounceMs: 0 });
    document.querySelectorAll<HTMLButtonElement>('.cron-zen__tab')[2].click();
    const tabs = document.querySelectorAll<HTMLButtonElement>('.cron-zen__tab');
    expect(tabs[2].classList.contains('is-active')).toBe(true);
    expect(api.controller.getActiveTab()).toBe('hour');
    api.destroy();
  });

  it('showPreview=false 应隐藏预览并加 compact', () => {
    const api = mountCronZen('#app', {
      value: '* * * * * ?',
      showPreview: false,
    });
    expect(document.querySelector('.cron-zen__preview')?.hasAttribute('hidden')).toBe(true);
    expect(document.querySelector('.cron-zen')?.classList.contains('cron-zen--compact')).toBe(
      true,
    );
    api.destroy();
  });

  it('onChange 在字段更新后触发', () => {
    const onChange = vi.fn();
    const api = mountCronZen('#app', {
      value: '* * * * * ?',
      debounceMs: 0,
      onChange,
    });
    api.controller.updateField('hour', { mode: 'specific', raw: '8', value: '8' });
    expect(onChange).toHaveBeenCalled();
    expect(api.getValue()).toBe('* * 8 * * ?');
    api.destroy();
  });

  it('setValue / getValue 往返', () => {
    const api = mountCronZen('#app', { value: '', debounceMs: 0 });
    api.setValue('0 0 9 * * ?');
    expect(api.getValue()).toMatch(/0 0 9/);
    api.destroy();
  });

  it('选择器不存在应抛错', () => {
    expect(() => mountCronZen('#missing')).toThrow(/not found/);
  });

  it('destroy 后清空容器', () => {
    const api = mountCronZen('#app', { value: '* * * * * ?' });
    api.destroy();
    expect(document.querySelector('#app')?.children.length).toBe(0);
  });

  it('locale=en-US 时 FieldEditor 与壳文案英文化', () => {
    const api = mountCronZen('#app', {
      value: '',
      debounceMs: 0,
      locale: 'en-US',
    });
    const text = document.body.textContent || '';
    expect(text).toContain('Second');
    expect(text).toContain('Every second');
    expect(text).toContain('Range');
    expect(text).toContain('Copy');
    expect(text).not.toContain('每秒');
    api.controller.setLocale('zh-CN');
    const zh = document.body.textContent || '';
    expect(zh).toContain('每秒');
    expect(zh).toContain('周期');
    api.destroy();
  });
});
