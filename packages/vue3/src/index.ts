/**
 * @description @cron-zen/vue3 公共导出入口
 */

import type { App, Plugin } from 'vue';
import CronZen from './CronZen.vue';
import CronZenPicker from './CronZenPicker.vue';

export { CronZen, CronZenPicker };
export { useCronZen, displayFieldValue } from './composables/useCronZen';
export type { UseCronZenOptions, UseCronZenReturn } from './composables/useCronZen';
export {
  describeCron,
  describeField,
  getNextRuns,
  expandFieldValues,
  formatRunTime,
  getCronTabs,
  stringifyField,
  parseCron,
  generateCron,
  enforceDayWeekMutex,
} from '@cron-zen/core';

export type {
  CronState,
  CronFieldState,
  CronFieldName,
  CronTabMeta,
  WeekFormat,
} from '@cron-zen/core';

/**
 * @description Vue 插件安装函数（仅注册无 UI 库依赖的 `CronZen`）
 * `CronZenPicker` 依赖 Element Plus，请按需 `import { CronZenPicker }`，不随插件全局注册。
 * @param {App} app - Vue 应用实例
 * @returns {void}
 * @example
 * import { createApp } from 'vue';
 * import { CronZenPlugin } from '@cron-zen/vue3';
 * createApp(App).use(CronZenPlugin);
 */
export function install(app: App): void {
  app.component('CronZen', CronZen);
}

/**
 * @description 插件对象（支持 app.use(CronZenPlugin)）
 */
export const CronZenPlugin: Plugin = { install };
