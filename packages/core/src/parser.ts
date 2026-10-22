import {
  type CronFieldMode,
  type CronFieldName,
  type CronFieldState,
  type CronState,
  type ParseResult,
  FIELD_ORDER,
  FIELD_RANGES,
  createDefaultCronState,
  createEveryField,
  createUnsetField,
} from './types';

/** 字段是否视为「已指定具体日程」（非 * / ?） */
function isConcreteSchedule(raw: string): boolean {
  const t = raw.trim();
  return t !== '' && t !== '*' && t !== '?';
}

/**
 * @description 转义 Cron 表达式中的 `%`，避免部分调度系统将其当作参数分隔符导致解析失败
 * @param {string} expression - 原始 Cron 表达式
 * @returns {string} 转义后的表达式（`%` → `\%`；已转义的不重复处理）
 * @example
 * escapeCronPercent('0 0 2 * * ? * %job'); // '0 0 2 * * ? * \\%job'
 */
export function escapeCronPercent(expression: string): string {
  return expression.replace(/(?<!\\)%/g, '\\%');
}

/**
 * @description 还原被转义的 `%`
 * @param {string} expression - 可能含 `\%` 的表达式
 * @returns {string} 还原后的表达式
 * @example
 * unescapeCronPercent('0 0 2 * * ? * \\%job'); // '0 0 2 * * ? * %job'
 */
export function unescapeCronPercent(expression: string): string {
  return expression.replace(/\\%/g, '%');
}

/**
 * @description 将单段字段字符串解析为可视化状态（容错：无法识别时降级为 specific + raw）
 * @param {string} raw - 字段原始值
 * @param {CronFieldName} field - 字段名（用于范围校验提示，不阻断降级）
 * @returns {{ state: CronFieldState; warning?: string }} 解析结果
 * @example
 * parseField('0/5', 'minute'); // { state: { mode: 'step', raw: '0/5', value: '0', secondary: '5' } }
 */
export function parseField(
  raw: string,
  field: CronFieldName,
): { state: CronFieldState; warning?: string } {
  const token = raw.trim();
  const range = FIELD_RANGES[field];

  if (token === '*') {
    return { state: createEveryField(token) };
  }
  if (token === '?') {
    return { state: createUnsetField(token) };
  }

  // L / nL（最后一天 / 最后一个星期几）
  if (/^\d*L$/i.test(token)) {
    const num = token.slice(0, -1);
    return {
      state: {
        mode: 'last',
        raw: token,
        value: num || undefined,
      },
    };
  }

  // nW（最接近的工作日）
  if (/^\d+W$/i.test(token)) {
    return {
      state: {
        mode: 'weekday',
        raw: token,
        value: token.slice(0, -1),
      },
    };
  }

  // n#m（第 m 个星期 n）
  if (/^\d+#\d+$/.test(token)) {
    const [weekDay, nth] = token.split('#');
    return {
      state: {
        mode: 'nth',
        raw: token,
        value: weekDay,
        secondary: nth,
      },
    };
  }

  // 步长：*/n 或 a/n 或 a-b/n
  if (token.includes('/')) {
    const [base, step] = token.split('/');
    if (!step || !/^\d+$/.test(step)) {
      return {
        state: { mode: 'specific', raw: token, value: token },
        warning: `${field} 字段步长格式异常，已降级保留原值: ${token}`,
      };
    }
    return {
      state: {
        mode: 'step',
        raw: token,
        value: base || '*',
        secondary: step,
      },
    };
  }

  // 列表
  if (token.includes(',')) {
    const values = token.split(',').map((v) => v.trim()).filter(Boolean);
    if (values.length === 0) {
      return {
        state: { mode: 'specific', raw: token, value: token },
        warning: `${field} 字段列表为空，已降级保留原值`,
      };
    }
    return {
      state: {
        mode: 'list',
        raw: token,
        value: token,
        values,
      },
    };
  }

  // 区间
  if (token.includes('-') && !/^-/.test(token)) {
    const [start, end] = token.split('-');
    if (start === undefined || end === undefined || start === '' || end === '') {
      return {
        state: { mode: 'specific', raw: token, value: token },
        warning: `${field} 字段区间格式异常，已降级保留原值: ${token}`,
      };
    }
    return {
      state: {
        mode: 'range',
        raw: token,
        value: start,
        secondary: end,
      },
    };
  }

  // 纯数字 specific，做范围软校验
  if (/^\d+$/.test(token)) {
    const num = Number(token);
    if (num < range.min || num > range.max) {
      return {
        state: { mode: 'specific', raw: token, value: token },
        warning: `${field} 字段值 ${token} 超出范围 [${range.min}, ${range.max}]，已保留原值供 UI 降级展示`,
      };
    }
    return {
      state: { mode: 'specific', raw: token, value: token },
    };
  }

  // 月/周英文缩写等非标准写法：降级保留
  return {
    state: { mode: 'specific', raw: token, value: token },
    warning: `${field} 字段使用非标准写法，已降级映射: ${token}`,
  };
}

/**
 * @description 校验日、周互斥：二者不能同时为具体值（非 * / ?）
 * @param {string} day - 日字段原始值
 * @param {string} week - 周字段原始值
 * @returns {{ ok: boolean; error?: string }} 校验结果
 * @example
 * assertDayWeekMutex('15', '6'); // { ok: false, error: '...' }
 * assertDayWeekMutex('15', '?'); // { ok: true }
 */
export function assertDayWeekMutex(
  day: string,
  week: string,
): { ok: boolean; error?: string } {
  if (isConcreteSchedule(day) && isConcreteSchedule(week)) {
    return {
      ok: false,
      error: '日和周不能同时指定，请将其中一方设为 ? 或 *',
    };
  }
  return { ok: true };
}

/**
 * @description 将字段段数组规范化为 7 段（支持 5/6/7 段输入）
 * - 5 段：补秒=0、年=*（分 时 日 月 周）
 * - 6 段：若首段像秒则补年=*，否则视为无秒并补秒=0
 * - 7 段：原样
 * @param {string[]} parts - 空白分割后的字段
 * @returns {{ parts: string[]; warning?: string } | { error: string }} 规范化结果
 */
function normalizeParts(
  parts: string[],
): { parts: string[]; warning?: string } | { error: string } {
  if (parts.length === 7) {
    return { parts };
  }
  if (parts.length === 6) {
    // 启发式：第一段为秒（0-59 的具体/通配），补年
    return { parts: [...parts, '*'], warning: '检测到 6 段表达式，已自动补全年字段为 *' };
  }
  if (parts.length === 5) {
    return {
      parts: ['0', ...parts, '*'],
      warning: '检测到 5 段表达式，已自动补全秒=0、年=*',
    };
  }
  return {
    error: `Cron 表达式字段数量非法（期望 5/6/7 段，实际 ${parts.length} 段）`,
  };
}

/**
 * @description 解析 Cron 表达式为可视化状态对象（支持 5/6/7 段；反解析容错不崩溃）
 * @param {string} expression - Cron 表达式（例如: '0 0 2 * * ? *'）
 * @returns {ParseResult} 包含 success 状态及解析后的 state；硬错误时 success=false
 * @example
 * const res = parseCron('0 0 2 * * ? *');
 * if (res.success) console.log(res.state);
 *
 * // 日周互斥
 * parseCron('0 0 2 15 * 6'); // success: false
 */
export function parseCron(expression: string): ParseResult {
  if (expression == null || typeof expression !== 'string') {
    return {
      success: false,
      error: 'Cron 表达式必须是非空字符串',
      state: createDefaultCronState(),
    };
  }

  const trimmed = unescapeCronPercent(expression.trim());
  if (!trimmed) {
    return {
      success: false,
      error: 'Cron 表达式不能为空',
      state: createDefaultCronState(),
    };
  }

  // 乱码 / 明显非法字符（允许数字、字母、以及 Cron 常用符号）
  if (/[^\w\s*?\-,/#\\%]/.test(trimmed)) {
    return {
      success: false,
      error: 'Cron 表达式包含非法字符',
      state: createDefaultCronState(),
      warning: '已降级为默认 UI 状态，请检查输入',
    };
  }

  const rawParts = trimmed.split(/\s+/).filter(Boolean);
  const normalized = normalizeParts(rawParts);
  if ('error' in normalized) {
    return {
      success: false,
      error: normalized.error,
      state: createDefaultCronState(),
    };
  }

  const warnings: string[] = [];
  if (normalized.warning) {
    warnings.push(normalized.warning);
  }

  const [second, minute, hour, day, month, week, year] = normalized.parts;
  const mutex = assertDayWeekMutex(day, week);
  if (!mutex.ok) {
    return {
      success: false,
      error: mutex.error,
      state: createDefaultCronState(),
    };
  }

  const state = {} as CronState;
  const fieldValues = [second, minute, hour, day, month, week, year];

  for (let i = 0; i < FIELD_ORDER.length; i++) {
    const name = FIELD_ORDER[i];
    const { state: fieldState, warning } = parseField(fieldValues[i], name);
    state[name] = fieldState;
    if (warning) {
      warnings.push(warning);
    }
  }

  const expressionOut = escapeCronPercent(normalized.parts.join(' '));
  const hasSoftWarning = warnings.length > 0;

  return {
    success: true,
    state,
    expression: expressionOut,
    warning: hasSoftWarning ? warnings.join('；') : undefined,
  };
}

/**
 * @description 从 CronState 读取指定字段的 mode（便于 UI / 测试断言）
 * @param {CronState} state - 可视化状态
 * @param {CronFieldName} field - 字段名
 * @returns {CronFieldMode} 字段模式
 * @example
 * getFieldMode(state, 'week'); // 'unset'
 */
export function getFieldMode(state: CronState, field: CronFieldName): CronFieldMode {
  return state[field].mode;
}
