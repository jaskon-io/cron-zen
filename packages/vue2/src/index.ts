/**
 * @description @cron-zen/vue2 公共导出入口
 */
import type { PluginObject, VueConstructor } from 'vue';
import CronZen from './CronZen.vue';

export { CronZen };
export {
  useCronZen,
  displayFieldValue,
  getCronTabs,
  FIELD_RANGES,
} from './composables/useCronZen';
export type { UseCronZenOptions, UseCronZenReturn } from './composables/useCronZen';

export {
  describeCron,
  describeField,
  getNextRuns,
  expandFieldValues,
  formatRunTime,
  parseCron,
  generateCron,
  enforceDayWeekMutex,
  stringifyField,
} from '@cron-zen/core';

export type {
  CronState,
  CronFieldState,
  CronFieldName,
  CronTabMeta,
  WeekFormat,
} from '@cron-zen/core';

/**
 * @description Vue2 插件安装函数
 * @param {VueConstructor} Vue - Vue 构造函数
 * @returns {void}
 * @example
 * import Vue from 'vue';
 * import { install } from '@cron-zen/vue2';
 * Vue.use(install);
 */
export function install(Vue: VueConstructor): void {
  Vue.component('CronZen', CronZen);
}

/**
 * @description 插件对象（支持 Vue.use(CronZenPlugin)）
 */
export const CronZenPlugin: PluginObject<undefined> = { install };
