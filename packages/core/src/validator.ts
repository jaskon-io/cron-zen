import {
  type CronFieldName,
  type CronFieldState,
  type CronState,
  type ValidateResult,
  FIELD_ORDER,
  FIELD_RANGES,
  createUnsetField,
  createEveryField,
} from './types';

/**
 * @description 判断字段是否为「具体日程」（非 every / unset）
 * @param {CronFieldState} field - 字段状态
 * @returns {boolean} 是否为具体值
 * @example
 * isConcreteField({ mode: 'specific', raw: '15', value: '15' }); // true
 * isConcreteField({ mode: 'every', raw: '*' }); // false
 */
export function isConcreteField(field: CronFieldState): boolean {
  return field.mode !== 'every' && field.mode !== 'unset';
}

/**
 * @description 获取指定年月的天数（用于拦截 2 月 31 日等非法组合）
 * @param {number} month - 月（1-12）
 * @param {number} [year=2000] - 年（用于闰年判断；缺省按闰年 2000）
 * @returns {number} 该月天数；非法月份返回 0
 * @example
 * getDaysInMonth(2, 2024); // 29
 * getDaysInMonth(2, 2023); // 28
 * getDaysInMonth(4); // 30
 */
export function getDaysInMonth(month: number, year = 2000): number {
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    return 0;
  }
  return new Date(year, month, 0).getDate();
}

/**
 * @description 从字段状态中提取可用于数值校验的整数列表（specific / range / list / step 起点）
 * @param {CronFieldState} field - 字段状态
 * @returns {number[]} 解析出的整数；无法解析则返回空数组
 * @example
 * extractNumericValues({ mode: 'list', raw: '1,15', values: ['1', '15'] }); // [1, 15]
 */
export function extractNumericValues(field: CronFieldState): number[] {
  switch (field.mode) {
    case 'every':
    case 'unset':
    case 'last':
    case 'weekday':
    case 'nth':
      return [];
    case 'specific': {
      if (field.value != null && /^\d+$/.test(field.value)) {
        return [Number(field.value)];
      }
      return [];
    }
    case 'range': {
      const start = field.value != null && /^\d+$/.test(field.value) ? Number(field.value) : NaN;
      const end =
        field.secondary != null && /^\d+$/.test(field.secondary)
          ? Number(field.secondary)
          : NaN;
      if (Number.isNaN(start) || Number.isNaN(end)) {
        return [];
      }
      return [start, end];
    }
    case 'step': {
      const nums: number[] = [];
      if (field.value != null && field.value !== '*' && /^\d+$/.test(field.value)) {
        nums.push(Number(field.value));
      }
      if (field.secondary != null && /^\d+$/.test(field.secondary)) {
        nums.push(Number(field.secondary));
      }
      // 区间步长 a-b/n
      if (field.value != null && field.value.includes('-')) {
        const [a, b] = field.value.split('-');
        if (a && /^\d+$/.test(a)) nums.push(Number(a));
        if (b && /^\d+$/.test(b)) nums.push(Number(b));
      }
      return nums;
    }
    case 'list': {
      const source = field.values?.length
        ? field.values
        : (field.value ?? '').split(',').map((v) => v.trim());
      return source.filter((v) => /^\d+$/.test(v)).map(Number);
    }
    default:
      return [];
  }
}

/**
 * @description 校验单个字段的数值是否落在合法范围内
 * @param {CronFieldName} name - 字段名
 * @param {CronFieldState} field - 字段状态
 * @returns {string[]} 错误信息列表（无错误则为空）
 * @example
 * validateFieldRange('hour', { mode: 'specific', raw: '25', value: '25' });
 * // ['hour 字段值 25 超出范围 [0, 23]']
 */
export function validateFieldRange(name: CronFieldName, field: CronFieldState): string[] {
  const range = FIELD_RANGES[name];
  const errors: string[] = [];
  const nums = extractNumericValues(field);

  for (const num of nums) {
    // step 的 secondary 是步长，允许从 1 起，上限放宽到字段 max
    if (field.mode === 'step' && field.secondary != null && Number(field.secondary) === num) {
      if (num < 1 || num > range.max) {
        errors.push(`${name} 字段步长 ${num} 非法，应在 [1, ${range.max}]`);
      }
      continue;
    }
    if (num < range.min || num > range.max) {
      errors.push(`${name} 字段值 ${num} 超出范围 [${range.min}, ${range.max}]`);
    }
  }

  if (field.mode === 'range' && nums.length === 2 && nums[0] > nums[1]) {
    errors.push(`${name} 字段区间起点不能大于终点: ${field.raw}`);
  }

  if (field.mode === 'nth') {
    const weekDay = field.value != null ? Number(field.value) : NaN;
    const nth = field.secondary != null ? Number(field.secondary) : NaN;
    if (!Number.isNaN(weekDay) && (weekDay < 0 || weekDay > 7)) {
      errors.push(`week 字段 nth 星期值非法: ${field.value}`);
    }
    if (!Number.isNaN(nth) && (nth < 1 || nth > 5)) {
      errors.push(`week 字段 nth 序数非法（应为 1-5）: ${field.secondary}`);
    }
  }

  if (field.mode === 'weekday') {
    const day = field.value != null ? Number(field.value) : NaN;
    if (!Number.isNaN(day) && (day < 1 || day > 31)) {
      errors.push(`day 字段 W 值非法: ${field.value}`);
    }
  }

  return errors;
}

/**
 * @description 校验日与月组合是否存在不可能的日历日期（如 2 月 31 日）
 * @param {CronFieldState} day - 日字段
 * @param {CronFieldState} month - 月字段
 * @param {CronFieldState} [year] - 年字段（用于闰年；可选）
 * @returns {{ errors: string[]; warnings: string[] }} 校验结果
 * @example
 * validateDayMonthCombo(
 *   { mode: 'specific', raw: '31', value: '31' },
 *   { mode: 'specific', raw: '2', value: '2' },
 * );
 * // { errors: ['非法日期: 2月没有31日'], warnings: [] }
 */
export function validateDayMonthCombo(
  day: CronFieldState,
  month: CronFieldState,
  year?: CronFieldState,
): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  const dayNums = extractNumericValues(day).filter((d) => d >= 1 && d <= 31);
  if (dayNums.length === 0) {
    return { errors, warnings };
  }

  const yearNums = year ? extractNumericValues(year) : [];
  const sampleYear = yearNums[0] ?? 2000;

  const monthNums = extractNumericValues(month).filter((m) => m >= 1 && m <= 12);

  // 月为 * / ? 时：对「明显不可能」的日给出警告（如 31 在所有月并不都合法）
  if (monthNums.length === 0) {
    const maxDay = Math.max(...dayNums);
    if (maxDay === 31) {
      warnings.push('日字段包含 31，部分月份（如 2/4/6/9/11）不存在该日，请确认调度系统行为');
    } else if (maxDay === 30) {
      warnings.push('日字段包含 30，2 月不存在该日，请确认调度系统行为');
    } else if (maxDay === 29) {
      warnings.push('日字段包含 29，非闰年的 2 月不存在该日，请确认调度系统行为');
    }
    return { errors, warnings };
  }

  for (const m of monthNums) {
    // 年份未锁定时：2/30、2/31 必然非法；2/29 仅警告（取决于闰年）
    if (m === 2 && yearNums.length === 0) {
      for (const d of dayNums) {
        if (d >= 30) {
          errors.push(`非法日期: ${m}月没有${d}日`);
        } else if (d === 29) {
          warnings.push('2 月 29 日仅在闰年有效，当前未限定年份，请确认调度系统行为');
        }
      }
      continue;
    }

    const dim = getDaysInMonth(m, sampleYear);
    for (const d of dayNums) {
      if (d > dim) {
        errors.push(`非法日期: ${m}月没有${d}日`);
      }
    }
  }

  return { errors, warnings };
}

/**
 * @description 校验日周互斥（基于 CronState）
 * @param {CronState} state - 可视化状态
 * @returns {{ ok: boolean; error?: string }} 校验结果
 * @example
 * validateDayWeekMutex(state); // { ok: true } 或带 error
 */
export function validateDayWeekMutex(state: CronState): { ok: boolean; error?: string } {
  if (isConcreteField(state.day) && isConcreteField(state.week)) {
    return {
      ok: false,
      error: '日和周不能同时指定，请将其中一方设为 ? 或 *',
    };
  }
  return { ok: true };
}

/**
 * @description 日周互斥修正选项
 */
export interface EnforceDayWeekMutexOptions {
  /**
   * @description 双方皆具体时保留哪一侧（另一侧改为 ?）；默认 day
   */
  prefer?: 'day' | 'week';
}

/**
 * @description 日周互斥自动修正（Quartz：日/周不能同时指定具体值）
 * @param {CronState} state - 原始状态
 * @param {EnforceDayWeekMutexOptions} [options] - 优先保留侧
 * @returns {{ state: CronState; changed: boolean; warning?: string }} 修正后的状态
 * @example
 * const { state, warning } = enforceDayWeekMutex(rawState, { prefer: 'week' });
 */
export function enforceDayWeekMutex(
  state: CronState,
  options: EnforceDayWeekMutexOptions = {},
): {
  state: CronState;
  changed: boolean;
  warning?: string;
} {
  const prefer = options.prefer ?? 'day';
  const next: CronState = {
    second: { ...state.second },
    minute: { ...state.minute },
    hour: { ...state.hour },
    day: { ...state.day },
    month: { ...state.month },
    week: { ...state.week },
    year: { ...state.year },
  };

  const dayConcrete = isConcreteField(next.day);
  const weekConcrete = isConcreteField(next.week);

  if (dayConcrete && weekConcrete) {
    if (prefer === 'week') {
      next.day = createUnsetField();
      return {
        state: next,
        changed: true,
        warning: '日和周不能同时指定，已自动将日字段设为 ?',
      };
    }
    next.week = createUnsetField();
    return {
      state: next,
      changed: true,
      warning: '日和周不能同时指定，已自动将周字段设为 ?',
    };
  }

  if (dayConcrete && next.week.mode === 'every') {
    next.week = createUnsetField();
    return {
      state: next,
      changed: true,
      warning: '已配置日字段，周字段已自动锁定为 ?',
    };
  }

  if (weekConcrete && next.day.mode === 'every') {
    next.day = createUnsetField();
    return {
      state: next,
      changed: true,
      warning: '已配置周字段，日字段已自动锁定为 ?',
    };
  }

  // 双方皆 every 时，规范为 日=* 周=?（Quartz 惯例）
  if (next.day.mode === 'every' && next.week.mode === 'every') {
    next.week = createUnsetField();
    return {
      state: next,
      changed: true,
      warning: '日与周均为 *，已按惯例将周字段调整为 ?',
    };
  }

  // 双方皆 unset 时，规范为 日=* 周=?
  if (next.day.mode === 'unset' && next.week.mode === 'unset') {
    next.day = createEveryField();
    return {
      state: next,
      changed: true,
      warning: '日与周均为 ?，已按惯例将日字段调整为 *',
    };
  }

  return { state: next, changed: false };
}

/**
 * @description 校验完整 Cron 可视化状态（范围、日周互斥、非法日期）
 * @param {CronState} state - 可视化状态
 * @returns {ValidateResult} 校验结果（valid / errors / warnings）
 * @example
 * const res = validateCronState(state);
 * if (!res.valid) console.error(res.errors);
 */
export function validateCronState(state: CronState): ValidateResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (state == null || typeof state !== 'object') {
    return {
      valid: false,
      errors: ['Cron 状态对象无效'],
      warnings: [],
    };
  }

  let fieldsComplete = true;
  for (const name of FIELD_ORDER) {
    const field = state[name];
    if (!field || typeof field !== 'object' || !field.mode) {
      errors.push(`缺少或无效的字段: ${name}`);
      fieldsComplete = false;
      continue;
    }
    errors.push(...validateFieldRange(name, field));
  }

  if (fieldsComplete) {
    const mutex = validateDayWeekMutex(state);
    if (!mutex.ok && mutex.error) {
      errors.push(mutex.error);
    }

    const combo = validateDayMonthCombo(state.day, state.month, state.year);
    errors.push(...combo.errors);
    warnings.push(...combo.warnings);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
