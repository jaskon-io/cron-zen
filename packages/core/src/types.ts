/**
 * @description Cron 字段名（7 段式：秒 分 时 日 月 周 年）
 */
export type CronFieldName =
  | 'second'
  | 'minute'
  | 'hour'
  | 'day'
  | 'month'
  | 'week'
  | 'year';

/**
 * @description 单个 Cron 字段的配置模式
 * - every: 每单位（*）
 * - range: 区间（如 1-5）
 * - step: 步长（如星号/5 或 0/5）
 * - list: 枚举列表（如 1,3,5）
 * - specific: 指定单个值
 * - last: 最后一天 / 最后一个星期几（L）
 * - weekday: 最接近工作日（W）
 * - nth: 第几个星期几（如 6#3）
 * - unset: 未指定 / 使用 ?（日周互斥占位）
 */
export type CronFieldMode =
  | 'every'
  | 'range'
  | 'step'
  | 'list'
  | 'specific'
  | 'last'
  | 'weekday'
  | 'nth'
  | 'unset';

/**
 * @description 单个 Cron 字段的可视化状态
 * @example
 * const hour: CronFieldState = { mode: 'specific', value: '2' };
 */
export interface CronFieldState {
  /**
   * @description 字段配置模式
   */
  mode: CronFieldMode;
  /**
   * @description 原始字段字符串（解析后保留，便于回显）
   */
  raw: string;
  /**
   * @description 主值：specific / range 起点 / step 起点 / list 源串 / nth 的星期等
   */
  value?: string;
  /**
   * @description range 终点，或 step 的步长，或 nth 的第几周
   */
  secondary?: string;
  /**
   * @description list 模式下的数值列表
   */
  values?: string[];
}

/**
 * @description 完整 Cron 可视化状态（对应 7 段表达式）
 * @example
 * const state: CronState = {
 *   second: { mode: 'specific', raw: '0', value: '0' },
 *   minute: { mode: 'specific', raw: '0', value: '0' },
 *   hour: { mode: 'specific', raw: '2', value: '2' },
 *   day: { mode: 'every', raw: '*' },
 *   month: { mode: 'every', raw: '*' },
 *   week: { mode: 'unset', raw: '?' },
 *   year: { mode: 'every', raw: '*' },
 * };
 */
export interface CronState {
  /** @description 秒（0-59） */
  second: CronFieldState;
  /** @description 分（0-59） */
  minute: CronFieldState;
  /** @description 时（0-23） */
  hour: CronFieldState;
  /** @description 日（1-31），与 week 互斥 */
  day: CronFieldState;
  /** @description 月（1-12） */
  month: CronFieldState;
  /** @description 周（0-7，0 与 7 均为周日），与 day 互斥 */
  week: CronFieldState;
  /** @description 年（可选，缺省按 * 处理） */
  year: CronFieldState;
}

/**
 * @description 解析结果：成功时返回 state，失败时返回 error；容错降级时 success=true 且带 warning
 * @example
 * const res: ParseResult = parseCron('0 0 2 * * ? *');
 * if (res.success) console.log(res.state);
 */
export interface ParseResult {
  /**
   * @description 是否解析成功（含容错降级成功）
   */
  success: boolean;
  /**
   * @description 解析得到的可视化状态；失败时可能仍提供最接近的降级状态
   */
  state?: CronState;
  /**
   * @description 错误信息（硬失败时必有）
   */
  error?: string;
  /**
   * @description 警告信息（容错降级时给出友好提示）
   */
  warning?: string;
  /**
   * @description 归一化后的 7 段表达式（成功时可选）
   */
  expression?: string;
}

/**
 * @description 校验结果
 * @example
 * const res: ValidateResult = validateCronState(state);
 * if (!res.valid) console.error(res.errors);
 */
export interface ValidateResult {
  /**
   * @description 是否通过硬性校验（无 errors）
   */
  valid: boolean;
  /**
   * @description 硬错误列表（阻止生成 / 提交）
   */
  errors: string[];
  /**
   * @description 软警告列表（可生成，但需 UI 提示）
   */
  warnings: string[];
}

/**
 * @description 生成结果
 * @example
 * const res: GenerateResult = generateCron(state);
 * if (res.success) console.log(res.expression);
 */
export interface GenerateResult {
  /**
   * @description 是否生成成功
   */
  success: boolean;
  /**
   * @description 7 段 Cron 表达式（成功时）
   */
  expression?: string;
  /**
   * @description 应用日周互斥等规则后的状态快照
   */
  state?: CronState;
  /**
   * @description 错误信息
   */
  error?: string;
  /**
   * @description 警告信息（如自动锁定周字段）
   */
  warning?: string;
}

/**
 * @description 周字段输出写法（对齐 cron.ren）
 * - number：1=周日 … 7=周六
 * - abbr：SUN、MON、TUE、WED、THU、FRI、SAT
 */
export type WeekFormat = 'number' | 'abbr';

/**
 * @description 生成选项
 */
export interface GenerateOptions {
  /**
   * @description 是否在生成前自动执行日周互斥修正（默认 true）
   */
  enforceMutex?: boolean;
  /**
   * @description 是否转义 `%`（默认 true）
   */
  escapePercent?: boolean;
  /**
   * @description 周字段输出写法：number=1~7（默认），abbr=SUN…SAT（对齐 cron.ren）
   */
  weekFormat?: WeekFormat;
}

/**
 * @description 字段数值合法范围
 */
export interface FieldRange {
  /** @description 字段名 */
  name: CronFieldName;
  /** @description 最小值（含） */
  min: number;
  /** @description 最大值（含） */
  max: number;
}

/**
 * @description 各字段合法范围常量映射
 */
export const FIELD_RANGES: Readonly<Record<CronFieldName, FieldRange>> = {
  second: { name: 'second', min: 0, max: 59 },
  minute: { name: 'minute', min: 0, max: 59 },
  hour: { name: 'hour', min: 0, max: 23 },
  day: { name: 'day', min: 1, max: 31 },
  month: { name: 'month', min: 1, max: 12 },
  week: { name: 'week', min: 0, max: 7 },
  year: { name: 'year', min: 1970, max: 2099 },
} as const;

/**
 * @description 7 段字段名顺序（与表达式从左到右一致）
 */
export const FIELD_ORDER: readonly CronFieldName[] = [
  'second',
  'minute',
  'hour',
  'day',
  'month',
  'week',
  'year',
] as const;

/**
 * @description 创建「每单位」字段状态
 * @param {string} [raw='*'] - 原始字符串
 * @returns {CronFieldState} every 模式状态
 * @example
 * const f = createEveryField(); // { mode: 'every', raw: '*' }
 */
export function createEveryField(raw = '*'): CronFieldState {
  return { mode: 'every', raw };
}

/**
 * @description 创建「未指定 / ?」字段状态（日周互斥占位）
 * @param {string} [raw='?'] - 原始字符串
 * @returns {CronFieldState} unset 模式状态
 * @example
 * const f = createUnsetField(); // { mode: 'unset', raw: '?' }
 */
export function createUnsetField(raw = '?'): CronFieldState {
  return { mode: 'unset', raw };
}

/**
 * @description 创建默认 Cron 可视化状态：每天 0 点 0 分 0 秒（`0 0 0 * * ? *`）
 * @returns {CronState} 默认状态
 * @example
 * const state = createDefaultCronState();
 * // second/minute/hour = 0, day/month/year = *, week = ?
 */
export function createDefaultCronState(): CronState {
  return {
    second: { mode: 'specific', raw: '0', value: '0' },
    minute: { mode: 'specific', raw: '0', value: '0' },
    hour: { mode: 'specific', raw: '0', value: '0' },
    day: createEveryField(),
    month: createEveryField(),
    week: createUnsetField(),
    year: createEveryField(),
  };
}
