/**
 * @description 保证 browser IIFE 产物存在且可挂载（构建后跑；CI 先 build）
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { execSync } from 'node:child_process';

const browserJs = resolve(__dirname, '../dist/cron-zen-vanilla.browser.js');

describe('browser IIFE bundle', () => {
  beforeAll(() => {
    if (!existsSync(browserJs)) {
      execSync('pnpm run build', { cwd: resolve(__dirname, '..'), stdio: 'pipe' });
    }
  });

  it('应产出 cron-zen-vanilla.browser.js 且含 mountCronZen', () => {
    expect(existsSync(browserJs)).toBe(true);
    const code = readFileSync(browserJs, 'utf8');
    expect(code.length).toBeGreaterThan(10_000);
    expect(code).toContain('mountCronZen');
  });

  it('在 jsdom 中应挂到 window.CronZen 并可 mount', async () => {
    const { JSDOM } = await import('jsdom');
    const dom = new JSDOM('<!DOCTYPE html><div id="cron"></div>', {
      runScripts: 'dangerously',
    });
    dom.window.eval(readFileSync(browserJs, 'utf8'));
    const CZ = (dom.window as unknown as { CronZen: typeof import('../src') }).CronZen;
    expect(CZ).toBeTruthy();
    expect(typeof CZ.mountCronZen).toBe('function');
    const api = CZ.mountCronZen(dom.window.document.getElementById('cron')!, {
      value: '* * * * * ?',
      debounceMs: 0,
    });
    expect(api.getValue()).toBe('* * * * * ?');
    api.destroy();
  });
});
