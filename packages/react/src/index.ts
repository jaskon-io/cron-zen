/**
 * @description @cron-zen/react 公共导出：React 18/19 薄适配（底层 vanilla）
 */

export { CronZen } from './CronZen';
export type { CronZenProps, CronZenRef } from './CronZen';

export { useCronZen } from './useCronZen';
export type { UseCronZenOptions, UseCronZenReturn } from './useCronZen';

export { mountCronZen, createCronZen, displayFieldValue } from '@cron-zen/vanilla';
export type {
  MountCronZenOptions,
  CronZenHandle,
  CreateCronZenOptions,
  CronZenController,
  CronZenSnapshot,
} from '@cron-zen/vanilla';

export {
  describeCron,
  describeField,
  getNextRuns,
  getPrevRuns,
  expandFieldValues,
  formatRunTime,
  getCronTabs,
  getCronPresets,
  getCronPreset,
  listCronPresetDefs,
  getUiMessages,
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
