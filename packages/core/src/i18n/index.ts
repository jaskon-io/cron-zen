import { enUS } from './en-US';
import type { CronLocaleCode, CronLocaleMessages, CronUiMessages } from './types';
import { zhCN } from './zh-CN';

export type { CronLocaleCode, CronLocaleMessages, CronUiMessages } from './types';
export { zhCN, enUS };

const BUILTIN: Record<CronLocaleCode, CronLocaleMessages> = {
  'zh-CN': zhCN,
  'en-US': enUS,
};

/**
 * @description describe / tabs 等 API 的 locale 入参
 */
export type CronLocaleInput = CronLocaleCode | CronLocaleMessages | string;

/**
 * @description 解析 locale：内置代码、自定义包，或回退 zh-CN
 * @param {CronLocaleInput} [locale] - 语言
 * @returns {CronLocaleMessages} 文案包
 * @example
 * resolveLocale('en-US');
 * resolveLocale('en'); // → en-US
 */
export function resolveLocale(locale?: CronLocaleInput): CronLocaleMessages {
  if (locale == null) return zhCN;
  if (typeof locale === 'object' && locale.tabs && locale.fieldUnits) {
    // 自定义包缺 ui 时回退内置，避免 FieldEditor 读空
    if (!locale.ui) {
      return { ...locale, ui: zhCN.ui };
    }
    return locale;
  }
  if (typeof locale === 'string') {
    const raw = locale.trim();
    if (raw in BUILTIN) return BUILTIN[raw as CronLocaleCode];
    const lower = raw.toLowerCase();
    if (lower === 'en' || lower.startsWith('en-')) return enUS;
    if (lower === 'zh' || lower.startsWith('zh-')) return zhCN;
  }
  return zhCN;
}

/**
 * @description 取 FieldEditor / 预览壳 UI 文案
 * @param {CronLocaleInput} [locale] - 语言
 * @returns {CronUiMessages}
 * @example
 * getUiMessages('en-US').every('second'); // 'Every second'
 */
export function getUiMessages(locale?: CronLocaleInput): CronUiMessages {
  return resolveLocale(locale).ui;
}

/**
 * @description 列出内置语言代码
 * @returns {CronLocaleCode[]}
 */
export function listLocales(): CronLocaleCode[] {
  return ['zh-CN', 'en-US'];
}
