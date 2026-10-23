import {
  shallowRef,
  watch,
  onBeforeUnmount,
  getCurrentInstance,
  type Ref,
} from 'vue';
import type {
  CronFieldName,
  CronFieldState,
  CronState,
  CronTabMeta,
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
  FIELD_RANGES,
  describeCron,
  formatRunTime,
  getNextRuns,
  getPrevRuns,
  getCronTabs,
  stringifyField,
  weekTokenUsesAbbr,
} from '@cron-zen/core';

/** 默认表达式（对齐 cron.ren：年不指定，不补默认 *） */
const DEFAULT_EXPRESSION = '* * * * * ?';

/**
 * @description 秒/分/时仅为「0」时视为 Quartz 常见占位，回显时跳过
 * @param {CronFieldState} f - 字段状态
 * @returns {boolean} 是否为占位 0
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
 * @description 字段是否算「有具体配置」（every / unset 都不算）
 * @param {CronFieldName} _name - 字段名
 * @param {CronFieldState} f - 状态
 * @returns {boolean} 是否具体
 */
function isEchoConcrete(_name: CronFieldName, f: CronFieldState): boolean {
  return f.mode !== 'every' && f.mode !== 'unset';
}

/**
 * @description 选中回显 Tab：跳过秒/分/时的占位 0
 * @param {CronState} s - 状态
 * @returns {CronFieldName} Tab 字段名
 * @example
 * // '0 0/5 * * * ? *' → minute
 */
function pickEchoTab(s: CronState): CronFieldName {
  let fallback: CronFieldName | null = null;
  for (const name of FIELD_ORDER) {
    const f = s[name];
    if (!isEchoConcrete(name, f)) continue;
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

export type { CronTabMeta, WeekFormat };
export { getCronTabs, FIELD_RANGES };

/**
 * @description useCronZen 配置项（Vue 2.7 Composition API，对齐 @cron-zen/vue3）
 */
export interface UseCronZenOptions {
  /** @description 外部 v-model 表达式（可选） */
  modelValue?: Ref<string | undefined>;
  /** @description 生成防抖毫秒数（默认 300） */
  debounceMs?: number;
  /** @description 最近触发次数（默认 10，最大 100） */
  nextCount?: number;
  /** @description 是否计算自然语言与近 N 次 */
  showPreview?: boolean;
  /** @description 周字段输出写法（默认 number） */
  weekFormat?: Ref<WeekFormat> | WeekFormat;
  /** @description IANA 时区 */
  timeZone?: Ref<string | undefined> | string;
  /** @description zh-CN | en-US */
  locale?: Ref<string | undefined> | string;
}

/**
 * @description useCronZen 返回值
 */
export interface UseCronZenReturn {
  /** @description 浅响应式 Cron 状态 */
  state: Ref<CronState>;
  /** @description 当前激活的 Tab 字段 */
  activeTab: Ref<CronFieldName>;
  /** @description 生成的表达式 */
  expression: Ref<string>;
  /** @description 自然语言描述 */
  description: Ref<string>;
  /** @description 最近即将触发（格式化） */
  nextRuns: Ref<string[]>;
  /** @description 最近已触发（格式化，新→旧） */
  prevRuns: Ref<string[]>;
  /** @description 校验结果 */
  validation: Ref<ValidateResult>;
  /** @description 警告 / 提示文案 */
  hint: Ref<string>;
  /** @description 周字段写法 */
  weekFormat: Ref<WeekFormat>;
  /** @description 近 N 次时区 */
  timeZone: Ref<string | undefined>;
  /** @description 文案语言 */
  locale: Ref<string>;
  /** @description 更新单个字段并触发日周互斥 */
  updateField: (name: CronFieldName, field: CronFieldState) => void;
  /** @description 设置周字段输出写法并立即重生成 */
  setWeekFormat: (format: WeekFormat) => void;
  /** @description 从表达式反解析到状态 */
  loadExpression: (expression: string) => void;
  /** @description 重置为默认状态 */
  reset: () => void;
  /** @description 立即刷新（跳过防抖） */
  flush: () => void;
}

/**
 * @description 规范化防抖与预览条数
 * @param {number | undefined} debounceMs - 防抖毫秒
 * @param {number | undefined} nextCount - 预览条数
 * @returns {{ debounceMs: number; nextCount: number }} 规范化结果
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
 * @description 解析 weekFormat 选项
 * @param {Ref<WeekFormat> | WeekFormat | undefined} input - 入参
 * @returns {WeekFormat} 初始写法
 */
function resolveWeekFormat(input?: Ref<WeekFormat> | WeekFormat): WeekFormat {
  if (input == null) return 'number';
  if (typeof input === 'string') return input === 'abbr' ? 'abbr' : 'number';
  return input.value === 'abbr' ? 'abbr' : 'number';
}

/**
 * @description CronZen 核心组合式 API（Vue 2.7）：shallowRef、防抖、日周互斥、销毁清理
 * @param {UseCronZenOptions} [options] - 配置项
 * @returns {UseCronZenReturn} 状态与操作方法
 * @example
 * const { state, expression, updateField } = useCronZen({
 *   modelValue: toRef(props, 'value'),
 * });
 */
export function useCronZen(options: UseCronZenOptions = {}): UseCronZenReturn {
  const { debounceMs, nextCount } = normalizeOptions(
    options.debounceMs,
    options.nextCount,
  );
  const showPreview = options.showPreview !== false;

  const state = shallowRef<CronState>(createDefaultCronState());
  const activeTab = shallowRef<CronFieldName>('second');
  const expression = shallowRef(DEFAULT_EXPRESSION);
  const description = shallowRef('');
  const nextRuns = shallowRef<string[]>([]);
  const prevRuns = shallowRef<string[]>([]);
  const validation = shallowRef<ValidateResult>({
    valid: true,
    errors: [],
    warnings: [],
  });
  const hint = shallowRef('');
  const weekFormat = shallowRef<WeekFormat>(resolveWeekFormat(options.weekFormat));
  const timeZone = shallowRef<string | undefined>(
    typeof options.timeZone === 'string'
      ? options.timeZone || undefined
      : options.timeZone?.value || undefined,
  );
  const locale = shallowRef(
    typeof options.locale === 'string'
      ? options.locale || 'zh-CN'
      : options.locale?.value || 'zh-CN',
  );

  let timer: ReturnType<typeof setTimeout> | null = null;
  let nextRunsTimer: ReturnType<typeof setTimeout> | null = null;
  let syncingOut = false;

  const NEXT_RUNS_DEFER_MS = 48;

  /**
   * @description 计算并写回近 N 次执行时间
   * @returns {void}
   */
  const refreshNextRuns = (): void => {
    if (!showPreview) {
      nextRuns.value = [];
      prevRuns.value = [];
      return;
    }
    const tzOpt = timeZone.value ? { timeZone: timeZone.value } : undefined;
    const now = new Date();
    nextRuns.value = getNextRuns(state.value, nextCount, now, tzOpt)
      .map((d) => formatRunTime(d, tzOpt))
      .filter(Boolean);
    prevRuns.value = getPrevRuns(state.value, nextCount, now, tzOpt)
      .map((d) => formatRunTime(d, tzOpt))
      .filter(Boolean);
  };

  /**
   * @description 防抖调度近 N 次预估
   * @param {boolean} immediate - 是否立即计算
   * @returns {void}
   */
  const scheduleNextRuns = (immediate: boolean): void => {
    if (!showPreview) {
      nextRuns.value = [];
      prevRuns.value = [];
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
    }, NEXT_RUNS_DEFER_MS);
  };

  /**
   * @description 根据 state 刷新本地表达式 / 描述 / 预览（不写回 v-model）
   * @param {{ immediateNextRuns?: boolean }} [opts] - 是否同步算近 N 次
   * @returns {void}
   */
  const applyLocal = (opts: { immediateNextRuns?: boolean } = {}): void => {
    const gen = generateCron(state.value, { weekFormat: weekFormat.value });
    if (gen.state) {
      state.value = gen.state;
    }

    validation.value = validateCronState(state.value);

    if (showPreview) {
      description.value = describeCron(state.value, { locale: locale.value });
      scheduleNextRuns(opts.immediateNextRuns === true);
    } else {
      description.value = '';
      nextRuns.value = [];
      prevRuns.value = [];
    }

    if (gen.warning) {
      hint.value = gen.warning;
    } else if (validation.value.warnings.length > 0) {
      hint.value = validation.value.warnings.join('；');
    } else if (!validation.value.valid) {
      hint.value = validation.value.errors.join('；');
    } else {
      hint.value = '';
    }

    if (gen.success && gen.expression) {
      expression.value = gen.expression;
    }
  };

  /**
   * @description 将当前 expression 写回外部 v-model
   * @returns {void}
   */
  const syncModel = (): void => {
    if (!options.modelValue) return;
    if (options.modelValue.value === expression.value) return;
    syncingOut = true;
    options.modelValue.value = expression.value;
    setTimeout(() => {
      syncingOut = false;
    }, 0);
  };

  /**
   * @description 立即刷新本地预览并同步 v-model
   * @returns {void}
   */
  const refreshNow = (): void => {
    if (timer != null) {
      clearTimeout(timer);
      timer = null;
    }
    applyLocal({ immediateNextRuns: true });
    syncModel();
  };

  /**
   * @description 预览即时；v-model 按 debounceMs 防抖写回
   * @returns {void}
   */
  const scheduleRefresh = (): void => {
    applyLocal({ immediateNextRuns: false });
    if (debounceMs <= 0) {
      syncModel();
      return;
    }
    if (timer != null) {
      clearTimeout(timer);
    }
    timer = setTimeout(() => {
      timer = null;
      applyLocal({ immediateNextRuns: true });
      syncModel();
    }, debounceMs);
  };

  /**
   * @description 更新字段并自动处理日周互斥
   * @param {CronFieldName} name - 字段名
   * @param {CronFieldState} field - 新字段状态
   * @returns {void}
   */
  const updateField = (name: CronFieldName, field: CronFieldState): void => {
    const next: CronState = { ...state.value, [name]: field };

    if (name === 'day' || name === 'week') {
      const enforced = enforceDayWeekMutex(next, { prefer: name });
      state.value = enforced.state;
      if (enforced.warning) {
        hint.value = enforced.warning;
      }
      refreshNow();
      return;
    }

    state.value = next;
    scheduleRefresh();
  };

  /**
   * @description 切换周字段写法并立即重生成
   * @param {WeekFormat} format - number | abbr
   * @returns {void}
   */
  const setWeekFormat = (format: WeekFormat): void => {
    weekFormat.value = format === 'abbr' ? 'abbr' : 'number';
    refreshNow();
  };

  /**
   * @description 空值原始态：不注入默认 Cron
   * @returns {void}
   */
  const resetToEmpty = (): void => {
    state.value = createDefaultCronState();
    weekFormat.value = 'number';
    activeTab.value = 'second';
    hint.value = '';
    expression.value = '';
    description.value = '';
    nextRuns.value = [];
    prevRuns.value = [];
    validation.value = { valid: true, errors: [], warnings: [] };
  };

  /**
   * @description 从 Cron 表达式反解析到 UI 状态
   * @param {string} expr - Cron 表达式
   * @returns {void}
   */
  const loadExpression = (expr: string): void => {
    if (typeof expr !== 'string') return;
    const trimmed = expr.trim();
    if (!trimmed) {
      resetToEmpty();
      return;
    }
    const parsed = parseCron(trimmed);
    if (!parsed.success) {
      hint.value = parsed.error ?? 'Cron 表达式无效';
      if (trimmed.length <= 256 && !/[<>]/.test(trimmed)) {
        expression.value = trimmed;
      }
      return;
    }
    if (parsed.state) {
      state.value = parsed.state;
      const weekPart = trimmed.split(/\s+/)[5] ?? '';
      if (weekTokenUsesAbbr(weekPart)) {
        weekFormat.value = 'abbr';
      } else if (/\d/.test(weekPart) || /^[L?]$/i.test(weekPart.trim())) {
        weekFormat.value = 'number';
      }
      expression.value = parsed.expression ?? trimmed;
      hint.value = parsed.warning ?? '';
      activeTab.value = pickEchoTab(parsed.state);
      refreshNow();
    }
  };

  /**
   * @description 重置为默认 `* * * * * ?`
   * @returns {void}
   */
  const reset = (): void => {
    state.value = createDefaultCronState();
    weekFormat.value = 'number';
    activeTab.value = 'second';
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
  }

  if (options.modelValue) {
    watch(
      () => options.modelValue!.value,
      (val) => {
        if (syncingOut) return;
        const next = val ?? '';
        if (!String(next).trim()) {
          resetToEmpty();
          return;
        }
        if (next !== expression.value) {
          loadExpression(next);
        }
      },
    );
  }

  if (options.weekFormat && typeof options.weekFormat !== 'string') {
    watch(
      () => (options.weekFormat as Ref<WeekFormat>).value,
      (v) => {
        const next = v === 'abbr' ? 'abbr' : 'number';
        if (weekFormat.value !== next) {
          weekFormat.value = next;
          refreshNow();
        }
      },
    );
  }

  if (options.timeZone && typeof options.timeZone !== 'string') {
    watch(
      () => (options.timeZone as Ref<string | undefined>).value,
      (v) => {
        timeZone.value = v || undefined;
        refreshNow();
      },
    );
  }

  if (options.locale && typeof options.locale !== 'string') {
    watch(
      () => (options.locale as Ref<string | undefined>).value,
      (v) => {
        locale.value = v || 'zh-CN';
        refreshNow();
      },
    );
  }

  if (getCurrentInstance()) {
    onBeforeUnmount(() => {
      if (timer != null) {
        clearTimeout(timer);
        timer = null;
      }
      if (nextRunsTimer != null) {
        clearTimeout(nextRunsTimer);
        nextRunsTimer = null;
      }
    });
  }

  return {
    state: state as Ref<CronState>,
    activeTab: activeTab as Ref<CronFieldName>,
    expression: expression as Ref<string>,
    description: description as Ref<string>,
    nextRuns: nextRuns as Ref<string[]>,
    prevRuns: prevRuns as Ref<string[]>,
    validation: validation as Ref<ValidateResult>,
    hint: hint as Ref<string>,
    weekFormat: weekFormat as Ref<WeekFormat>,
    timeZone: timeZone as Ref<string | undefined>,
    locale: locale as Ref<string>,
    updateField,
    setWeekFormat,
    loadExpression,
    reset,
    flush: refreshNow,
  };
}

/**
 * @description 预览区字段显示（年 unset→*，周可 abbr）
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
