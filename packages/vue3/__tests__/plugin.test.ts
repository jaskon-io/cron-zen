import { describe, it, expect } from 'vitest';
import { createApp, h } from 'vue';
import { CronZenPlugin } from '../src/index';

describe('CronZenPlugin', () => {
  it('应只注册 CronZen，不注册 CronZenPicker', () => {
    const app = createApp({ render: () => h('div') });
    app.use(CronZenPlugin);
    expect(app.component('CronZen')).toBeTruthy();
    expect(app.component('CronZenPicker')).toBeUndefined();
  });
});
