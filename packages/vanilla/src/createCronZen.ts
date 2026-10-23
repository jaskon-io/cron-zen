import type {
  CronFieldName,
  CronFieldState,
  CronState,
  ValidateResult,
  WeekFormat,
} from '@cron-zen/core';
import {
  createDefaultCronState,
  generateCron,
  parseCron,
  validateCronState,
  enforceDayWeekMutex,
  FIELD_ORDER,
  describeCron,
  formatRunTime,
  getNextRuns,
  stringifyField,
  weekTokenUsesAbbr,
} from '@cron-zen/core';

/** 默认表达式（对齐 cron.ren：年不指定） */
const DEFAULT_EXPRESSION = '* * * * * ?';

/**
 * @description 可读写的外部表达式绑定（替代 Vue Ref）
 */
export interface CronZenModel {
  /** @description 当前表达式 */
  get value(): string | undefined;
  set value(v: string | undefined);
}

/**
 * @description createCronZen 配置
 */
export interface CreateCronZenOptions {
  /** @description 外部表达式绑定 */
  modelValue?: CronZenModel;
  /** @description 写回防抖毫秒（默认 300；mount 默认传 0） */
  debounceMs?: number;
  /** @description 近 N 次（默认 10，最大 100） */
  nextCount?: number;
  /** @description 是否计算自然语言与近 N 次 */
  showPreview?: boolean;
  /** @description 周字段写法 */
  weekFormat?: WeekFormat;
  /** @description IANA 时区（近 N 次） */
  timeZone?: string;
  /** @description 自然语言语言 zh-CN | en-US */
  locale?: string;
  /** @description 表达式或状态变化回调 */
  onChange?: (payload: { expression: string; state: CronState }) => void;
}

/**
 * @description createCronZen 快照（只读视图）
 */
export interface CronZenSnapshot {
  state: CronState;
  activeTab: CronFieldName;
  expression: string;
  description: string;
  nextRuns: string[];
  validation: ValidateResult;
  hint: string;
  weekFormat: WeekFormat;
  timeZone?: string;
  locale: string;
}

/**
 * @description createCronZen 返回的无头控制器
 */
export interface CronZenController {
  /** @description 当前快照 */
  getSnapshot: () => CronZenSnapshot;
  /** @description 订阅变更（返回取消函数） */
  subscribe: (listener: () => void) => () => void;
  /** @description 当前激活 Tab */
  getActiveTab: () => CronFieldName;
  setActiveTab: (name: CronFieldName) => void;
  /** @description 更新字段 */
  updateField: (name: CronFieldName, field: CronFieldState) => void;
  setWeekFormat: (format: WeekFormat) => void;
  setTimeZone: (timeZone?: string) => void;
  setLocale: (locale: string) => void;
  loadExpression: (expression: string) => void;
  reset: () => void;
  flush: () => void;
  /** @description 销毁定时器 */
  destroy: () => void;
}

/**
 * @description 秒/分/时仅为「0」时视为占位
 * @param {CronFieldState} f - 字段
 * @returns {boolean}
 */
function isTrivialZero(f: CronFieldState): boolean {
  if (f.mode === 'specific' && (f.value === '0' || f.raw === '0')) return true;
  if (
    (f.mode === 'list' || f.mode === 'specific') &&
    f.values?.length === 1 &&
    f.values[0] === '0'
  ) {
    return true;
  }
  return false;
}

/**
 * @description 字段是否具体配置
 * @param {CronFieldState} f - 字段
 * @returns {boolean}
 */
function isEchoConcrete(f: CronFieldState): boolean {
  return f.mode !== 'every' && f.mode !== 'unset';
}

/**
 * @description 回显 Tab 选择
 * @param {CronState} s - 状态
 * @returns {CronFieldName}
 */
function pickEchoTab(s: CronState): CronFieldName {
  let fallback: CronFieldName | null = null;
  for (const name of FIELD_ORDER) {
    const f = s[name];
    if (!isEchoConcrete(f)) continue;
    if (
      (name === 'second' || name === 'minute' || name === 'hour') &&
      isTrivialZero(f)
    ) {
      if (fallback == null) fallback = name;
      continue;
    }
    return name;
  }
  return fallback ?? 'second';
}

/**
 * @description 规范化防抖与预览条数
 * @param {number | undefined} debounceMs - 防抖
 * @param {number | undefined} nextCount - 条数
 * @returns {{ debounceMs: number; nextCount: number }}
 */
function normalizeOptions(debounceMs?: number, nextCount?: number): {
  debounceMs: number;
  nextCount: number;
} {
  const d = Number.isFinite(debounceMs) ? Math.max(0, Math.floor(debounceMs as number)) : 300;
  const n = Number.isFinite(nextCount) ? Math.floor(nextCount as number) : 10;
  return {
    debounceMs: Math.min(d, 5000),
    nextCount: Math.min(Math.max(n, 1), 100),
  };
}

/**
 * @description 无框架 CronZen 状态机：日周互斥、防抖写回、近 N 次延后、销毁清理
 * @param {CreateCronZenOptions} [options] - 配置
 * @returns {CronZenController} 控制器
 * @example
 * const ctrl = createCronZen({ debounceMs: 0 });
 * ctrl.updateField('hour', { mode: 'specific', raw: '8', value: '8' });
 * console.log(ctrl.getSnapshot().expression);
 */
export function createCronZen(options: CreateCronZenOptions = {}): CronZenController {
  const { debounceMs, nextCount } = normalizeOptions(
    options.debounceMs,
    options.nextCount,
  );
  const showPreview = options.showPreview !== false;

  let state = createDefaultCronState();
  let activeTab: CronFieldName = 'second';
  let expression = DEFAULT_EXPRESSION;
  let description = '';
  let nextRuns: string[] = [];
  let validation: ValidateResult = { valid: true, errors: [], warnings: [] };
  let hint = '';
  let weekFormat: WeekFormat = options.weekFormat === 'abbr' ? 'abbr' : 'number';
  let timeZone: string | undefined = options.timeZone?.trim() || undefined;
  let locale = options.locale?.trim() || 'zh-CN';

  let timer: ReturnType<typeof setTimeout> | null = null;
  let nextRunsTimer: ReturnType<typeof setTimeout> | null = null;
  let syncingOut = false;
  let destroyed = false;

  const listeners = new Set<() => void>();
  const NEXT_RUNS_DEFER_MS = 48;

  const notify = (): void => {
    for (const fn of listeners) fn();
    options.onChange?.({ expression, state });
  };

  const getSnapshot = (): CronZenSnapshot => ({
    state,
    activeTab,
    expression,
    description,
    nextRuns,
    validation,
    hint,
    weekFormat,
    timeZone,
    locale,
  });

  const refreshNextRuns = (): void => {
    if (!showPreview) {
      nextRuns = [];
      return;
    }
    const tzOpt = timeZone ? { timeZone } : undefined;
    nextRuns = getNextRuns(state, nextCount, new Date(), tzOpt)
      .map((d) => formatRunTime(d, tzOpt))
      .filter(Boolean);
  };

  const scheduleNextRuns = (immediate: boolean): void => {
    if (!showPreview) {
      nextRuns = [];
      return;
    }
    if (nextRunsTimer != null) {
      clearTimeout(nextRunsTimer);
      nextRunsTimer = null;
    }
    if (immediate) {
      refreshNextRuns();
      return;
    }
    nextRunsTimer = setTimeout(() => {
      nextRunsTimer = null;
      refreshNextRuns();
      notify();
    }, NEXT_RUNS_DEFER_MS);
  };

  const applyLocal = (opts: { immediateNextRuns?: boolean } = {}): void => {
    const gen = generateCron(state, { weekFormat });
    if (gen.state) state = gen.state;
    validation = validateCronState(state);

    if (showPreview) {
      description = describeCron(state, { locale });
      scheduleNextRuns(opts.immediateNextRuns === true);
    } else {
      description = '';
      nextRuns = [];
    }

    if (gen.warning) hint = gen.warning;
    else if (validation.warnings.length > 0) hint = validation.warnings.join('；');
    else if (!validation.valid) hint = validation.errors.join('；');
    else hint = '';

    if (gen.success && gen.expression) expression = gen.expression;
  };

  const syncModel = (): void => {
    if (!options.modelValue) return;
    if (options.modelValue.value === expression) return;
    syncingOut = true;
    options.modelValue.value = expression;
    setTimeout(() => {
      syncingOut = false;
    }, 0);
  };

  const refreshNow = (): void => {
    if (destroyed) return;
    if (timer != null) {
      clearTimeout(timer);
      timer = null;
    }
    applyLocal({ immediateNextRuns: true });
    syncModel();
    notify();
  };

  const scheduleRefresh = (): void => {
    if (destroyed) return;
    applyLocal({ immediateNextRuns: false });
    notify();
    if (debounceMs <= 0) {
      syncModel();
      return;
    }
    if (timer != null) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      applyLocal({ immediateNextRuns: true });
      syncModel();
      notify();
    }, debounceMs);
  };

  const updateField = (name: CronFieldName, field: CronFieldState): void => {
    if (destroyed) return;
    const next: CronState = { ...state, [name]: field };
    if (name === 'day' || name === 'week') {
      const enforced = enforceDayWeekMutex(next, { prefer: name });
      state = enforced.state;
      if (enforced.warning) hint = enforced.warning;
      refreshNow();
      return;
    }
    state = next;
    scheduleRefresh();
  };

  const setWeekFormat = (format: WeekFormat): void => {
    weekFormat = format === 'abbr' ? 'abbr' : 'number';
    refreshNow();
  };

  const setTimeZone = (tz?: string): void => {
    timeZone = tz?.trim() || undefined;
    refreshNow();
  };

  const setLocale = (loc: string): void => {
    locale = loc?.trim() || 'zh-CN';
    refreshNow();
  };

  const resetToEmpty = (): void => {
    state = createDefaultCronState();
    weekFormat = 'number';
    activeTab = 'second';
    hint = '';
    expression = '';
    description = '';
    nextRuns = [];
    validation = { valid: true, errors: [], warnings: [] };
    notify();
  };

  const loadExpression = (expr: string): void => {
    if (destroyed || typeof expr !== 'string') return;
    const trimmed = expr.trim();
    if (!trimmed) {
      resetToEmpty();
      return;
    }
    const parsed = parseCron(trimmed);
    if (!parsed.success) {
      hint = parsed.error ?? 'Cron 表达式无效';
      if (trimmed.length <= 256 && !/[<>]/.test(trimmed)) {
        expression = trimmed;
      }
      notify();
      return;
    }
    if (parsed.state) {
      state = parsed.state;
      const weekPart = trimmed.split(/\s+/)[5] ?? '';
      if (weekTokenUsesAbbr(weekPart)) weekFormat = 'abbr';
      else if (/\d/.test(weekPart) || /^[L?]$/i.test(weekPart.trim())) {
        weekFormat = 'number';
      }
      expression = parsed.expression ?? trimmed;
      hint = parsed.warning ?? '';
      activeTab = pickEchoTab(parsed.state);
      refreshNow();
    }
  };

  const reset = (): void => {
    state = createDefaultCronState();
    weekFormat = 'number';
    activeTab = 'second';
    refreshNow();
  };

  const hasModelBinding = options.modelValue != null;
  const initialModel = options.modelValue?.value;
  if (typeof initialModel === 'string' && initialModel.trim()) {
    loadExpression(initialModel);
  } else if (hasModelBinding) {
    resetToEmpty();
  } else {
    applyLocal({ immediateNextRuns: true });
    notify();
  }

  // 外部 model 轮询式同步：由 mount 在 setValue 时调用 loadExpression
  // 若绑定对象被外部改写，调用方应主动 loadExpression / setValue

  return {
    getSnapshot,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    getActiveTab: () => activeTab,
    setActiveTab: (name) => {
      activeTab = name;
      notify();
    },
    updateField,
    setWeekFormat,
    setTimeZone,
    setLocale,
    loadExpression,
    reset,
    flush: refreshNow,
    destroy: () => {
      destroyed = true;
      if (timer != null) {
        clearTimeout(timer);
        timer = null;
      }
      if (nextRunsTimer != null) {
        clearTimeout(nextRunsTimer);
        nextRunsTimer = null;
      }
      listeners.clear();
    },
  };
}

/**
 * @description 预览区字段显示
 * @param {CronFieldName} name - 字段名
 * @param {CronFieldState} field - 字段状态
 * @param {WeekFormat} weekFormat - 周写法
 * @returns {string} 显示串
 */
export function displayFieldValue(
  name: CronFieldName,
  field: CronFieldState,
  weekFormat: WeekFormat = 'number',
): string {
  return stringifyField(field, { fieldName: name, weekFormat });
}
