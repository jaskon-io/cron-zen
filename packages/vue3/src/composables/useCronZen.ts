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
} from '@cron-zen/core';
import { describeCron } from '../utils/describe';
import { formatRunTime, getNextRuns } from '../utils/nextRuns';

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
   * @description 最近触发次数（默认 10）
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

const TABS: CronFieldName[] = [
  'second',
  'minute',
  'hour',
  'day',
  'month',
  'week',
  'year',
];

/**
 * @description CronZen 核心组合式 API：shallowRef 状态、300ms 防抖生成、日周互斥、销毁清理
 * @param {UseCronZenOptions} [options] - 配置项
 * @returns {UseCronZenReturn} 状态与操作方法
 * @example
 * const { state, expression, updateField } = useCronZen({
 *   modelValue: toRef(props, 'modelValue'),
 * });
 */
export function useCronZen(options: UseCronZenOptions = {}): UseCronZenReturn {
  const debounceMs = options.debounceMs ?? 300;
  const nextCount = options.nextCount ?? 10;

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

  /**
   * @description 立即根据当前 state 刷新表达式 / 描述 / 预览
   * @returns {void}
   */
  const refreshNow = (): void => {
    const gen = generateCron(state.value);
    if (gen.state) {
      state.value = gen.state;
    }
    if (gen.success && gen.expression) {
      expression.value = gen.expression;
      if (options.modelValue && options.modelValue.value !== gen.expression) {
        options.modelValue.value = gen.expression;
      }
    }
    hint.value = [gen.warning, ...(validation.value.warnings || [])]
      .filter(Boolean)
      .join('；');

    validation.value = validateCronState(state.value);
    description.value = describeCron(state.value);
    nextRuns.value = getNextRuns(state.value, nextCount).map(formatRunTime);

    if (gen.warning) {
      hint.value = gen.warning;
    } else if (validation.value.warnings.length > 0) {
      hint.value = validation.value.warnings.join('；');
    } else if (!validation.value.valid) {
      hint.value = validation.value.errors.join('；');
    } else {
      hint.value = '';
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

    // 日 / 周切换为具体值时，给出互斥提示由 enforce 处理
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
    const parsed = parseCron(expr);
    if (parsed.state) {
      state.value = parsed.state;
      expression.value = parsed.expression ?? expr;
      if (parsed.warning) {
        hint.value = parsed.warning;
      }
      if (parsed.error) {
        hint.value = parsed.error;
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
        if (val && val !== expression.value) {
          loadExpression(val);
        }
      },
      { immediate: true },
    );
  }

  // 首次同步
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

/**
 * @description Tab 元数据（供 UI 渲染）
 */
export interface CronTabMeta {
  /** @description 字段名 */
  name: CronFieldName;
  /** @description 显示标签 */
  label: string;
  /** @description 合法最小值 */
  min: number;
  /** @description 合法最大值 */
  max: number;
}

/**
 * @description 获取七段 Tab 元数据列表
 * @returns {CronTabMeta[]} Tab 列表
 * @example
 * const tabs = getCronTabs();
 */
export function getCronTabs(): CronTabMeta[] {
  const labels: Record<CronFieldName, string> = {
    second: '秒',
    minute: '分',
    hour: '时',
    day: '日',
    month: '月',
    week: '周',
    year: '年',
  };
  return TABS.map((name) => ({
    name,
    label: labels[name],
    min: FIELD_RANGES[name].min,
    max: FIELD_RANGES[name].max,
  }));
}

/**
 * @description 暴露字段范围常量，便于模板使用
 */
export { FIELD_RANGES, TABS };
