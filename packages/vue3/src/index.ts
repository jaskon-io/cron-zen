/**
 * @description @cron-zen/vue3 公共导出入口
 */

import type { App, Plugin } from 'vue';
import CronZen from './CronZen.vue';

export { CronZen };
export { useCronZen } from './composables/useCronZen';
export type { UseCronZenOptions, UseCronZenReturn } from './composables/useCronZen';
export {
  describeCron,
  describeField,
  getNextRuns,
  expandFieldValues,
  formatRunTime,
  getCronTabs,
} from '@cron-zen/core';

export type {
  CronState,
  CronFieldState,
  CronFieldName,
  CronTabMeta,
} from '@cron-zen/core';

/**
 * @description Vue 插件安装函数
 * @param {App} app - Vue 应用实例
 * @returns {void}
 * @example
 * import { createApp } from 'vue';
 * import { install } from '@cron-zen/vue3';
 * createApp(App).use(install);
 */
export function install(app: App): void {
  app.component('CronZen', CronZen);
}

/**
 * @description 插件对象（支持 app.use(CronZenPlugin)）
 */
export const CronZenPlugin: Plugin = { install };
