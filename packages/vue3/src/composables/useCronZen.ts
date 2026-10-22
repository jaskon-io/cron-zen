import {
  shallowRef,
  watch,
  onBeforeUnmount,
  type Ref,
  type ShallowRef,
} from 'vue';
import {
  type CronFieldName,
  type CronFieldState,
  type CronState,
  type ValidateResult,
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
} from '@cron-zen/core';
export type { CronTabMeta } from '@cron-zen/core';
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
  /** @description 更新单个字段并触发日周互斥 */
  updateField: (name: CronFieldName, field: CronFieldState) => void;
  /** @description 从表达式反解析到状态 */
  loadExpression: (expression: string) => void;
  /** @description 重置为默认状态 */
  reset: () => void;
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
 * @description CronZen 核心组合式 API：shallowRef 状态、防抖生成、日周互斥、销毁清理
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

  const state = shallowRef<CronState>(createDefaultCronState());
  const activeTab = shallowRef<CronFieldName>('hour');
  const expression = shallowRef('0 0 0 * * ? *');
  const description = shallowRef('');
  const nextRuns = shallowRef<string[]>([]);
  const validation = shallowRef<ValidateResult>({
    valid: true,
    errors: [],
    warnings: [],
  });
  const hint = shallowRef('');

  let timer: ReturnType<typeof setTimeout> | null = null;
  /** 正在由内部写回 v-model，忽略外部 watch，避免解析↔生成回环 */
  let syncingOut = false;

  /**
   * @description 立即根据当前 state 刷新表达式 / 描述 / 预览
   * @returns {void}
   */
  const refreshNow = (): void => {
    const gen = generateCron(state.value);
    if (gen.state) {
      state.value = gen.state;
    }

    validation.value = validateCronState(state.value);
    description.value = describeCron(state.value);
    nextRuns.value = getNextRuns(state.value, nextCount)
      .map(formatRunTime)
      .filter(Boolean);

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
        // 微任务结束后再允许外部 watch，覆盖同一事件环内的同步触发
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
   * @description 更新字段并自动处理日周互斥
   * @param {CronFieldName} name - 字段名
   * @param {CronFieldState} field - 新字段状态
   * @returns {void}
   * @example
   * updateField('hour', { mode: 'specific', raw: '2', value: '2' });
   */
  const updateField = (name: CronFieldName, field: CronFieldState): void => {
    const next: CronState = { ...state.value, [name]: field };

    if (name === 'day' || name === 'week') {
      const enforced = enforceDayWeekMutex(next);
      state.value = enforced.state;
      if (enforced.warning) {
        hint.value = enforced.warning;
      }
    } else {
      state.value = next;
    }
    scheduleRefresh();
  };

  /**
   * @description 从 Cron 表达式反解析到 UI 状态
   * @param {string} expr - Cron 表达式
   * @returns {void}
   * @example
   * loadExpression('0 0 2 * * ? *');
   */
  const loadExpression = (expr: string): void => {
    if (typeof expr !== 'string') return;
    const parsed = parseCron(expr);
    if (parsed.state) {
      state.value = parsed.state;
      expression.value = parsed.expression ?? expr;
      if (parsed.error) {
        hint.value = parsed.error;
      } else if (parsed.warning) {
        hint.value = parsed.warning;
      }
      scheduleRefresh();
    }
  };

  /**
   * @description 重置为默认每天 0 点
   * @returns {void}
   */
  const reset = (): void => {
    state.value = createDefaultCronState();
    scheduleRefresh();
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

  // 首次同步（immediate watch 可能已 schedule，这里立即出首屏）
  refreshNow();

  onBeforeUnmount(() => {
    if (timer != null) {
      clearTimeout(timer);
      timer = null;
    }
  });

  return {
    state,
    activeTab: activeTab as unknown as Ref<CronFieldName>,
    expression: expression as unknown as Ref<string>,
    description: description as unknown as Ref<string>,
    nextRuns: nextRuns as unknown as Ref<string[]>,
    validation: validation as unknown as Ref<ValidateResult>,
    hint: hint as unknown as Ref<string>,
    updateField,
    loadExpression,
    reset,
  };
}
