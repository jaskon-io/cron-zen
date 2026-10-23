import type { CronLocaleMessages } from './types';

/**
 * @description English (US) messages
 */
export const enUS: CronLocaleMessages = {
  code: 'en-US',
  tabs: {
    second: 'Second',
    minute: 'Minute',
    hour: 'Hour',
    day: 'Day',
    month: 'Month',
    week: 'Week',
    year: 'Year',
  },
  fieldUnits: {
    second: 'second',
    minute: 'minute',
    hour: 'hour',
    day: 'day',
    month: 'month',
    week: 'week',
    year: 'year',
  },
  ui: {
    editorUnits: {
      second: 'second',
      minute: 'minute',
      hour: 'hour',
      day: 'day',
      month: 'month',
      week: 'week',
      year: 'year',
    },
    every: (unit) => `Every ${unit}`,
    unset: 'Unspecified',
    wildcardsAllowed: (w) => `Allowed wildcards ${w}`,
    yearOptional: 'optional',
    range: 'Range',
    from: 'from',
    step: 'Interval',
    stepStart: (unit) => `${unit}(s), every`,
    stepOnce: (unit) => `${unit}(s)`,
    dayStepUnit: 'day',
    nearestWorkdayPrefix: 'Weekday nearest to day',
    nearestWorkdaySuffix: 'of the month',
    lastDayOfMonth: 'Last day of the month',
    lastWorkdayOfMonth: 'Last weekday of the month',
    nthPrefix: 'The',
    nthMiddle: '',
    lastWeekdayPrefix: 'Last',
    specific: 'Specific',
    weekFormatLabel: 'Week field format:',
    weekFormatNumber: 'Numbers 1–7 (1=Sun, 2=Mon, …, 7=Sat)',
    weekFormatAbbr: 'Abbr SUN, MON, TUE, WED, THU, FRI, SAT',
    weekFormatAria: 'Week field format',
    weekDayEditor: {
      0: 'Sunday',
      1: 'Sunday',
      2: 'Monday',
      3: 'Tuesday',
      4: 'Wednesday',
      5: 'Thursday',
      6: 'Friday',
      7: 'Saturday',
    },
    monthEditor: {
      1: 'Jan',
      2: 'Feb',
      3: 'Mar',
      4: 'Apr',
      5: 'May',
      6: 'Jun',
      7: 'Jul',
      8: 'Aug',
      9: 'Sep',
      10: 'Oct',
      11: 'Nov',
      12: 'Dec',
    },
    mutexDayOccupied:
      'Week is set; choosing a concrete Day will set Week to ? (day/week mutex).',
    mutexWeekOccupied:
      'Day is set; choosing a concrete Week will set Day to ? (day/week mutex).',
    expression: 'Expression',
    copy: 'Copy',
    copied: 'Copied',
    reset: 'Reset',
    editField: (label) => `Edit ${label}`,
    nextRunsTitle: (n) => `Next ${n} run(s)`,
    prevRunsTitle: (n) => `Previous ${n} run(s)`,
    cannotEstimate: 'Cannot estimate runs for this mode (e.g. L / W / #)',
    expressionPlaceholder: '(generated while editing)',
    presetsLabel: 'Presets',
    presetsPlaceholder: 'Choose a preset…',
    ariaTabs: 'Cron fields',
    ariaBody: 'Field editor',
    ariaPreview: 'Preview',
  },
  presets: {
    'every-minute': 'Every minute',
    'every-5-minutes': 'Every 5 minutes',
    'every-30-minutes': 'Every 30 minutes',
    'every-hour': 'Every hour',
    'every-day-midnight': 'Daily at midnight',
    'every-day-9am': 'Daily at 9:00',
    'weekdays-9am': 'Weekdays at 9:00',
    'every-monday-9am': 'Every Monday at 9:00',
    'first-day-month': '1st of month at midnight',
    'last-day-month': 'Last day of month at midnight',
  },
  everyDay: 'Every day',
  customSchedule: 'Custom schedule',
  atUnit: (value, unit) => `at ${value} ${unit}`,
  everyWeekday: (weekday) => `every ${weekday}`,
  weekRange: (from, to) => `${from}–${to}`,
  range: (unit, from, to) => `${unit} ${from}-${to}`,
  step: (step, unit, from) => `every ${step} ${unit}(s) (from ${from})`,
  list: (unit, items) => `${unit}: ${items}`,
  listJoin: (items) => items.join(', '),
  lastDay: 'last day of month',
  lastWeekdayOfMonth: (w) => `last ${w} of month`,
  lastWorkday: 'last weekday of month',
  nearestWorkday: (day) => `weekday nearest to day ${day}`,
  nthWeekday: (n, w) => `${n}${ordinal(n)} ${w} of month`,
  yearSpecific: (y) => `year ${y}`,
  hourSpecific: (h) => `${h}h`,
  minuteSpecific: (m) => `${m}m`,
  secondSpecific: (s) => `${s}s`,
  weekDayFull: {
    0: 'Sunday',
    1: 'Sunday',
    2: 'Monday',
    3: 'Tuesday',
    4: 'Wednesday',
    5: 'Thursday',
    6: 'Friday',
    7: 'Saturday',
  },
  weekDayShort: {
    0: 'Sun',
    1: 'Sun',
    2: 'Mon',
    3: 'Tue',
    4: 'Wed',
    5: 'Thu',
    6: 'Fri',
    7: 'Sat',
  },
};

/**
 * @description 英文序数后缀
 * @param {string} n - 数字串
 * @returns {string} st/nd/rd/th
 */
function ordinal(n: string): string {
  const v = Number(n);
  if (!Number.isFinite(v)) return 'th';
  const j = v % 10;
  const k = v % 100;
  if (j === 1 && k !== 11) return 'st';
  if (j === 2 && k !== 12) return 'nd';
  if (j === 3 && k !== 13) return 'rd';
  return 'th';
}
