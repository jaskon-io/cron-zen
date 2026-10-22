import {
  shallowRef,
  watch,
  onBeforeUnmount,
  getCurrentInstance,
  type Ref,
  type ShallowRef,
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
  FIELD_RANGES,
  describeCron,
  formatRunTime,
  getNextRuns,
  getCronTabs,
  stringifyField,
} from '@cron-zen/core';

export type { CronTabMeta, WeekFormat };
export { getCronTabs, FIELD_RANGES };

/**
 * @description useCronZen 配置项
 */
export interface UseCronZenOptions {
  /**
   * @description 外部 v-model 表达式（可选）
   */
  modelValue?: Ref<string | undefined>;
  /**
   * @description 生成防抖毫秒数（默认 300）
   */
  debounceMs?: number;
  /**
   * @description 最近触发次数（默认 10，最大 100）
   */
  nextCount?: number;
  /**
   * @description 是否计算自然语言与近 N 次（弹窗精简模式可关）
   */
  showPreview?: boolean;
  /**
   * @description 周字段输出写法（默认 number）
   */
  weekFormat?: Ref<WeekFormat> | WeekFormat;
}

/**
 * @description useCronZen 返回值
 */
export interface UseCronZenReturn {
  /** @description 浅响应式 Cron 状态 */
  state: ShallowRef<CronState>;
  /** @description 当前激活的 Tab 字段 */
  activeTab: Ref<CronFieldName>;
  /** @description 生成的表达式 */
  expression: Ref<string>;
  /** @description 自然语言描述 */
  description: Ref<string>;
  /** @description 最近触发时间（格式化） */
  nextRuns: Ref<string[]>;
  /** @description 校验结果 */
  validation: Ref<ValidateResult>;
  /** @description 警告 / 提示文案 */
  hint: Ref<string>;
  /** @description 周字段写法 */
  weekFormat: Ref<WeekFormat>;
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
 * @description 规范化防抖与预览条数，避免异常 props 拖垮主线程
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
 * @description CronZen 核心组合式 API：shallowRef 状态、防抖生成、日周互斥、周写法、销毁清理
 * @param {UseCronZenOptions} [options] - 配置项
 * @returns {UseCronZenReturn} 状态与操作方法
 * @example
 * const { state, expression, updateField } = useCronZen({
 *   modelValue: toRef(props, 'modelValue'),
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
  const expression = shallowRef('0 0 0 * * ? *');
  const description = shallowRef('');
  const nextRuns = shallowRef<string[]>([]);
  const validation = shallowRef<ValidateResult>({
    valid: true,
    errors: [],
    warnings: [],
  });
  const hint = shallowRef('');
  const weekFormat = shallowRef<WeekFormat>(resolveWeekFormat(options.weekFormat));

  let timer: ReturnType<typeof setTimeout> | null = null;
  /** 正在由内部写回 v-model，忽略外部 watch，避免解析↔生成回环 */
  let syncingOut = false;

  /**
   * @description 立即根据当前 state 刷新表达式 / 描述 / 预览
   * @returns {void}
   */
  const refreshNow = (): void => {
    const gen = generateCron(state.value, { weekFormat: weekFormat.value });
    if (gen.state) {
      state.value = gen.state;
    }

    validation.value = validateCronState(state.value);

    if (showPreview) {
      description.value = describeCron(state.value);
      nextRuns.value = getNextRuns(state.value, nextCount)
        .map(formatRunTime)
        .filter(Boolean);
    } else {
      description.value = '';
      nextRuns.value = [];
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
      if (options.modelValue && options.modelValue.value !== gen.expression) {
        syncingOut = true;
        options.modelValue.value = gen.expression;
        setTimeout(() => {
          syncingOut = false;
        }, 0);
      }
    }
  };

  /**
   * @description 防抖刷新（默认 300ms）
   * @returns {void}
   */
  const scheduleRefresh = (): void => {
    if (timer != null) {
      clearTimeout(timer);
    }
    timer = setTimeout(() => {
      timer = null;
      refreshNow();
    }, debounceMs);
  };

  /**
   * @description 更新字段并自动处理日周互斥（日/周变更立即刷新，保证联动预览）
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
   * @description 切换周字段写法并立即重生成表达式
   * @param {WeekFormat} format - number | abbr
   * @returns {void}
   */
  const setWeekFormat = (format: WeekFormat): void => {
    weekFormat.value = format === 'abbr' ? 'abbr' : 'number';
    refreshNow();
  };

  /**
   * @description 从 Cron 表达式反解析到 UI 状态
   * @param {string} expr - Cron 表达式
   * @returns {void}
   */
  const loadExpression = (expr: string): void => {
    if (typeof expr !== 'string') return;
    const parsed = parseCron(expr);
    if (!parsed.success) {
      hint.value = parsed.error ?? 'Cron 表达式无效';
      expression.value = expr;
      return;
    }
    if (parsed.state) {
      state.value = parsed.state;
      // 若表达式含英文周写法则同步 UI 开关
      const weekPart = (parsed.expression ?? expr).trim().split(/\s+/)[5] ?? '';
      if (/[A-Za-z]/.test(weekPart)) {
        weekFormat.value = 'abbr';
      }
      expression.value = parsed.expression ?? expr;
      hint.value = parsed.warning ?? '';
      refreshNow();
    }
  };

  /**
   * @description 重置为默认每天 0 点
   * @returns {void}
   */
  const reset = (): void => {
    state.value = createDefaultCronState();
    refreshNow();
  };

  if (options.modelValue) {
    watch(
      () => options.modelValue!.value,
      (val) => {
        if (syncingOut) return;
        if (val && val !== expression.value) {
          loadExpression(val);
        }
      },
      { immediate: true },
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

  refreshNow();

  if (getCurrentInstance()) {
    onBeforeUnmount(() => {
      if (timer != null) {
        clearTimeout(timer);
        timer = null;
      }
    });
  }

  return {
    state,
    activeTab: activeTab as unknown as Ref<CronFieldName>,
    expression: expression as unknown as Ref<string>,
    description: description as unknown as Ref<string>,
    nextRuns: nextRuns as unknown as Ref<string[]>,
    validation: validation as unknown as Ref<ValidateResult>,
    hint: hint as unknown as Ref<string>,
    weekFormat: weekFormat as unknown as Ref<WeekFormat>,
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
