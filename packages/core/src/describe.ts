import type { CronFieldName, CronFieldState, CronState } from "./types";
import {
  resolveLocale,
  type CronLocaleInput,
  type CronLocaleMessages
} from "./i18n";
import { weekAbbrToNumber } from "./week";

/**
 * @description describe 选项
 */
export interface DescribeOptions {
  /** @description 语言：zh-CN（默认）/ en-US / 自定义文案包 */
  locale?: CronLocaleInput;
}

/**
 * @description 将周 token 转为当前 locale 的全称标签
 * @param {string | undefined} token - 数字或 SUN…SAT
 * @param {CronLocaleMessages} messages - 文案
 * @returns {string}
 */
function formatWeekToken(
  token: string | undefined,
  messages: CronLocaleMessages
): string {
  if (token == null || token === "") return "";
  if (typeof token === "string") {
    const abbrNum = weekAbbrToNumber(token);
    if (abbrNum != null) return messages.weekDayFull[abbrNum] ?? token;
  }
  const n = Number(token);
  if (Number.isFinite(n) && messages.weekDayFull[n]) {
    return messages.weekDayFull[n];
  }
  return String(token);
}

/**
 * @description 周短标签
 * @param {string | number | undefined} token - token
 * @param {CronLocaleMessages} messages - 文案
 * @returns {string}
 */
function formatWeekShort(
  token: string | number | undefined,
  messages: CronLocaleMessages
): string {
  if (token == null || token === "") return "";
  if (typeof token === "string") {
    const abbrNum = weekAbbrToNumber(token);
    if (abbrNum != null) return messages.weekDayShort[abbrNum] ?? token;
  }
  const n = typeof token === "number" ? token : Number(token);
  if (Number.isFinite(n) && messages.weekDayShort[n]) {
    return messages.weekDayShort[n];
  }
  return String(token);
}

/**
 * @description 将单个字段状态转为简短描述片段
 * @param {CronFieldName | string} fieldKeyOrLabel - 字段名（推荐）或旧版中文 label
 * @param {CronFieldState} field - 字段状态
 * @param {DescribeOptions} [options] - locale 等
 * @returns {string} 描述片段；every/unset 返回空串
 * @example
 * describeField('hour', { mode: 'specific', raw: '2', value: '2' }, { locale: 'en-US' });
 */
export function describeField(
  fieldKeyOrLabel: CronFieldName | string,
  field: CronFieldState,
  options?: DescribeOptions
): string {
  const messages = resolveLocale(options?.locale);
  const name = resolveFieldName(fieldKeyOrLabel, messages);
  const unit = name ? messages.fieldUnits[name] : fieldKeyOrLabel;
  const isWeek = name === "week" || fieldKeyOrLabel === "周";

  switch (field.mode) {
    case "every":
    case "unset":
      return "";
    case "specific": {
      if (isWeek) {
        const day = formatWeekToken(field.value ?? field.raw, messages);
        return day ? messages.everyWeekday(day) : "";
      }
      return messages.atUnit(field.value ?? field.raw, unit);
    }
    case "range": {
      if (isWeek) {
        const from = formatWeekToken(field.value, messages);
        const to = formatWeekToken(field.secondary, messages);
        if (from && to) return messages.weekRange(from, to);
      }
      return messages.range(unit, field.value ?? "", field.secondary ?? "");
    }
    case "step":
      return messages.step(field.secondary ?? "1", unit, field.value || "*");
    case "list": {
      const items = (field.values ?? field.value?.split(",") ?? []).filter(
        Boolean
      );
      if (items.length === 0) return "";
      if (isWeek) {
        return messages.listJoin(
          items.map(t => formatWeekToken(t, messages)).filter(Boolean)
        );
      }
      return messages.list(
        unit,
        items.join(messages.code === "zh-CN" ? "、" : ", ")
      );
    }
    case "last":
      return field.value
        ? messages.lastWeekdayOfMonth(formatWeekShort(field.value, messages))
        : messages.lastDay;
    case "lastWeekday":
      return messages.lastWorkday;
    case "weekday":
      return messages.nearestWorkday(String(field.value ?? ""));
    case "nth":
      return messages.nthWeekday(
        String(field.secondary ?? ""),
        formatWeekShort(field.value ?? "", messages)
      );
    default:
      return field.raw;
  }
}

/**
 * @description 兼容旧调用：中文 label → 字段名
 * @param {string} keyOrLabel - 入参
 * @param {CronLocaleMessages} messages - 文案
 * @returns {CronFieldName | null}
 */
function resolveFieldName(
  keyOrLabel: string,
  messages: CronLocaleMessages
): CronFieldName | null {
  const keys: CronFieldName[] = [
    "second",
    "minute",
    "hour",
    "day",
    "month",
    "week",
    "year"
  ];
  if ((keys as string[]).includes(keyOrLabel)) {
    return keyOrLabel as CronFieldName;
  }
  // 旧版中文 label
  const zhMap: Record<string, CronFieldName> = {
    秒: "second",
    分: "minute",
    分钟: "minute",
    小时: "hour",
    日: "day",
    月: "month",
    周: "week",
    年: "year"
  };
  if (zhMap[keyOrLabel]) return zhMap[keyOrLabel];
  for (const k of keys) {
    if (
      messages.fieldUnits[k] === keyOrLabel ||
      messages.tabs[k] === keyOrLabel
    ) {
      return k;
    }
  }
  return null;
}

/**
 * @description 字段是否为数值 0 的 specific
 * @param {CronFieldState} field - 字段
 * @returns {boolean}
 */
function isSpecificZero(field: CronFieldState): boolean {
  return field.mode === "specific" && String(field.value ?? "") === "0";
}

/**
 * @description 是否为「工作日」周区间（周一至周五，Quartz 2-6）
 * @param {CronFieldState} week - 周字段
 * @returns {boolean}
 */
function isWeekdaysRange(week: CronFieldState): boolean {
  if (week.mode !== "range") return false;
  const from = Number(week.value);
  const to = Number(week.secondary);
  return from === 2 && to === 6;
}

/**
 * @description 中文：日字段语义片段（不含「每月」前缀）
 * @param {CronFieldState} day - 日字段
 * @param {CronLocaleMessages} messages - 文案
 * @returns {string}
 */
/**
 * @description 去掉月/日里的前导零（02 → 2）
 * @param {string | undefined} value - 原始值
 * @returns {string}
 */
function stripLeadingZero(value: string | undefined): string {
  if (value == null || value === "") return "";
  if (!/^\d+$/.test(value)) return value;
  return String(Number(value));
}

function formatZhDayPart(
  day: CronFieldState,
  messages: CronLocaleMessages
): string {
  switch (day.mode) {
    case "specific":
      return `${stripLeadingZero(day.value)}号`;
    case "range":
      return `${stripLeadingZero(day.value)}～${stripLeadingZero(
        day.secondary
      )}号`;
    case "list": {
      const items = (day.values ?? day.value?.split(",") ?? [])
        .filter(Boolean)
        .map(v => stripLeadingZero(v));
      return items.length ? `${items.join("、")}号` : "";
    }
    case "step": {
      const step = day.secondary ?? "1";
      const from =
        day.value && day.value !== "*" ? stripLeadingZero(day.value) : "1";
      return from === "1" ? `每${step}天` : `从${from}号起每${step}天`;
    }
    case "last":
      return day.value
        ? messages.lastWeekdayOfMonth(formatWeekShort(day.value, messages))
        : "最后一天";
    case "lastWeekday":
      return "最后一个工作日";
    case "weekday":
      return messages.nearestWorkday(String(day.value ?? ""));
    case "nth":
      return messages.nthWeekday(
        String(day.secondary ?? ""),
        formatWeekShort(day.value ?? "", messages)
      );
    default:
      return describeField("day", day, { locale: messages });
  }
}

/**
 * @description 多时刻用的时段拆分（对齐：上午10点，下午2点 / 中午12点，下午18点）
 * @param {number} hour - 0-23
 * @returns {{ period: string; clock: number }}
 */
function splitZhHourMulti(hour: number): { period: string; clock: number } {
  // 对齐业务文案：上午10点，下午2点，4点 / 中午12点，下午18点
  if (hour <= 5) return { period: "凌晨", clock: hour };
  if (hour < 12) return { period: "上午", clock: hour };
  if (hour === 12) return { period: "中午", clock: 12 };
  // 13–17 用 12 小时制（下午2点）；18 点保留 18（下午18点）
  if (hour < 18) return { period: "下午", clock: hour - 12 };
  if (hour === 18) return { period: "下午", clock: 18 };
  return { period: "晚上", clock: hour - 12 };
}

/**
 * @description 单时刻文案：凌晨用时段，其余直接「8点/12点」（对齐每天8点执行）
 * @param {number} hour - 0-23
 * @returns {string}
 */
function formatZhHourPointSingle(hour: number): string {
  if (hour <= 5) return `凌晨${hour}点`;
  return `${hour}点`;
}

/**
 * @description 多时刻列表：每天上午10点，下午2点，4点
 * @param {number[]} hours - 小时列表
 * @returns {string}
 */
function formatZhHourPoints(hours: number[]): string {
  const sorted = [...hours]
    .filter(h => Number.isFinite(h) && h >= 0 && h <= 23)
    .sort((a, b) => a - b);
  if (sorted.length === 0) return "";
  // 单点走单时刻规则
  if (sorted.length === 1) return formatZhHourPointSingle(sorted[0]);
  let lastPeriod = "";
  const parts: string[] = [];
  for (const h of sorted) {
    const { period, clock } = splitZhHourMulti(h);
    if (period !== lastPeriod) {
      parts.push(`${period}${clock}点`);
      lastPeriod = period;
    } else {
      parts.push(`${clock}点`);
    }
  }
  return parts.join("，");
}

/**
 * @description 解析小时字段为数值列表（specific / list / range）
 * @param {CronFieldState} hour - 小时字段
 * @returns {number[] | null} 无法语义化时返回 null
 */
function collectHourNumbers(hour: CronFieldState): number[] | null {
  if (hour.mode === "specific") {
    const n = Number(hour.value);
    return Number.isFinite(n) ? [n] : null;
  }
  if (hour.mode === "list") {
    const items = (hour.values ?? hour.value?.split(",") ?? [])
      .map(v => Number(v))
      .filter(n => Number.isFinite(n));
    return items.length ? items : null;
  }
  if (hour.mode === "range") {
    const from = Number(hour.value);
    const to = Number(hour.secondary);
    if (!Number.isFinite(from) || !Number.isFinite(to) || from > to)
      return null;
    // 区间过长时避免展开成一长串，交给普通描述
    if (to - from > 12) return null;
    const list: number[] = [];
    for (let h = from; h <= to; h += 1) list.push(h);
    return list;
  }
  return null;
}

/**
 * @description 中文：时钟时间语义（对齐业务频率 frequencyName）
 * @param {CronState} state - 状态
 * @param {CronLocaleMessages} messages - 文案
 * @returns {{ text: string; complete: boolean; withExec?: boolean; multiClock?: boolean }}
 * complete：完整短语（如每5分钟执行）；withExec：是否宜加「执行」；multiClock：多时刻（文案里通常不加执行）
 */
function formatZhTime(
  state: CronState,
  messages: CronLocaleMessages
): {
  text: string;
  complete: boolean;
  withExec?: boolean;
  multiClock?: boolean;
} {
  const opt = { locale: messages };
  const minuteZero = isSpecificZero(state.minute);
  const secondZero = isSpecificZero(state.second);
  const secondEveryOrZero = state.second.mode === "every" || secondZero;
  const minuteEveryOrZero = state.minute.mode === "every" || minuteZero;
  const minuteVal =
    state.minute.mode === "specific" ? Number(state.minute.value) : NaN;
  const minuteSuffix =
    state.minute.mode === "specific" &&
    Number.isFinite(minuteVal) &&
    minuteVal !== 0
      ? `${minuteVal}分`
      : "";

  // 每 N 秒执行（0/10 * * * * ?）
  if (
    state.second.mode === "step" &&
    state.minute.mode === "every" &&
    state.hour.mode === "every"
  ) {
    const step = state.second.secondary ?? "1";
    const from = state.second.value ?? "*";
    if (from === "*" || from === "0" || from === "") {
      return {
        text: `每${step}秒执行`,
        complete: true,
        withExec: false
      };
    }
    return {
      text: `从${from}秒起每${step}秒执行`,
      complete: true,
      withExec: false
    };
  }

  // 每 N 分钟执行（0 0/5 * * * ?）
  if (
    state.hour.mode === "every" &&
    state.minute.mode === "step" &&
    secondEveryOrZero
  ) {
    const step = state.minute.secondary ?? "1";
    const from = state.minute.value ?? "*";
    if (from === "*" || from === "0" || from === "") {
      return {
        text: `每${step}分钟执行`,
        complete: true,
        withExec: false
      };
    }
    return {
      text: `从${from}分起每${step}分钟执行`,
      complete: true,
      withExec: false
    };
  }

  // X点到Y点每间隔N分钟（0 0/5 19-22 * * ?）
  if (
    state.hour.mode === "range" &&
    state.minute.mode === "step" &&
    secondEveryOrZero
  ) {
    const from = state.hour.value ?? "0";
    const to = state.hour.secondary ?? from;
    const step = state.minute.secondary ?? "1";
    const minuteFrom = state.minute.value ?? "*";
    if (minuteFrom === "*" || minuteFrom === "0" || minuteFrom === "") {
      return {
        text: `${from}点到${to}点每间隔${step}分钟`,
        complete: true,
        withExec: false
      };
    }
    return {
      text: `${from}点到${to}点从${minuteFrom}分起每间隔${step}分钟`,
      complete: true,
      withExec: false
    };
  }

  // 每小时执行
  if (state.hour.mode === "every" && minuteZero && secondZero) {
    return { text: "每小时执行", complete: true, withExec: false };
  }

  // 每 N 小时执行
  if (state.hour.mode === "step" && minuteZero && secondZero) {
    const step = state.hour.secondary ?? "1";
    const from = state.hour.value ?? "*";
    if (from === "*" || from === "0" || from === "") {
      return {
        text: `每${step}小时执行`,
        complete: true,
        withExec: false
      };
    }
    return {
      text: `从${from}点起每${step}小时执行`,
      complete: true,
      withExec: false
    };
  }

  // 指定/枚举小时 → 单点「8点」/ 多点「上午10点，下午2点，4点」
  const hourNums = collectHourNumbers(state.hour);
  if (
    hourNums &&
    (minuteZero || minuteSuffix) &&
    secondEveryOrZero &&
    !(state.hour.mode === "range" && state.minute.mode === "step")
  ) {
    const clock = formatZhHourPoints(hourNums);
    if (clock) {
      if (minuteSuffix && hourNums.length === 1) {
        return {
          text: `${clock}${minuteSuffix}`,
          complete: false,
          withExec: true,
          multiClock: false
        };
      }
      if (minuteZero || minuteEveryOrZero) {
        return {
          text: clock,
          complete: false,
          withExec: hourNums.length === 1,
          multiClock: hourNums.length > 1
        };
      }
    }
  }

  const bits: string[] = [];
  if (state.hour.mode === "specific") {
    const n = Number(state.hour.value);
    bits.push(
      Number.isFinite(n) ? formatZhHourPointSingle(n) : `${state.hour.value}点`
    );
  } else if (state.hour.mode !== "every") {
    const h = describeField("hour", state.hour, opt);
    if (h) bits.push(h);
  }

  if (bits.length > 0 && minuteZero && secondZero) {
    return { text: bits.join(""), complete: false, withExec: true };
  }

  if (state.minute.mode === "specific") {
    bits.push(`${state.minute.value ?? ""}分`);
  } else if (state.minute.mode !== "every") {
    const m = describeField("minute", state.minute, opt);
    if (m) bits.push(m);
  }

  if (state.second.mode === "specific") {
    if (!(secondZero && bits.length > 0)) {
      bits.push(`${state.second.value ?? ""}秒`);
    }
  } else if (state.second.mode !== "every") {
    const s = describeField("second", state.second, opt);
    if (s) bits.push(s);
  }

  return {
    text: bits.join("").trim(),
    complete: false,
    withExec: bits.length > 0
  };
}

/**
 * @description 中文自然语言：对齐「每月 1 号 0 点 / 工作日 9 点」模板语感
 * @param {CronState} state - 状态
 * @param {CronLocaleMessages} messages - 文案
 * @returns {string}
 */
function describeCronZh(
  state: CronState,
  messages: CronLocaleMessages
): string {
  const opt = { locale: messages };
  const parts: string[] = [];
  const monthEvery = state.month.mode === "every";
  const weekActive = state.week.mode !== "every" && state.week.mode !== "unset";
  const dayActive = state.day.mode !== "every" && state.day.mode !== "unset";

  if (state.year.mode === "specific") {
    parts.push(`${state.year.value ?? ""}年`);
  } else if (state.year.mode !== "every") {
    const y = describeField("year", state.year, opt);
    if (y) parts.push(y);
  }

  if (!monthEvery) {
    if (state.month.mode === "specific") {
      parts.push(`${stripLeadingZero(state.month.value)}月`);
    } else if (state.month.mode === "range") {
      parts.push(
        `${stripLeadingZero(state.month.value)}～${stripLeadingZero(
          state.month.secondary
        )}月`
      );
    } else if (state.month.mode === "list") {
      const items = (state.month.values ?? state.month.value?.split(",") ?? [])
        .filter(Boolean)
        .map(v => stripLeadingZero(v))
        .join("、");
      if (items) parts.push(`${items}月`);
    } else {
      const m = describeField("month", state.month, opt);
      if (m) parts.push(m);
    }
  }

  if (weekActive) {
    if (isWeekdaysRange(state.week)) {
      parts.push("工作日");
    } else if (state.week.mode === "specific") {
      const day = formatWeekToken(state.week.value ?? state.week.raw, messages);
      if (day) parts.push(`每${day}`);
    } else if (state.week.mode === "range") {
      const from = formatWeekToken(state.week.value, messages);
      const to = formatWeekToken(state.week.secondary, messages);
      if (from && to) parts.push(`${from}至${to}`);
    } else if (state.week.mode === "list") {
      const items = (state.week.values ?? state.week.value?.split(",") ?? [])
        .map(t => formatWeekToken(t, messages))
        .filter(Boolean);
      if (items.length) parts.push(items.join("、"));
    } else {
      const w = describeField("week", state.week, opt);
      if (w) parts.push(w);
    }
  } else if (dayActive) {
    if (state.day.mode === "last" && !state.day.value) {
      parts.push(monthEvery ? "每月最后一天" : "最后一天");
    } else if (state.day.mode === "lastWeekday") {
      parts.push(monthEvery ? "每月最后一个工作日" : "最后一个工作日");
    } else {
      const dayPart = formatZhDayPart(state.day, messages);
      if (dayPart) {
        parts.push(
          monthEvery && !dayPart.startsWith("每") ? `每月${dayPart}` : dayPart
        );
      }
    }
  }

  const time = formatZhTime(state, messages);
  const isMidnight =
    isSpecificZero(state.hour) &&
    isSpecificZero(state.minute) &&
    (state.second.mode === "every" || isSpecificZero(state.second));

  // 「每5分钟执行 / 19点到22点每间隔5分钟」本身已是完整语义
  if (time.complete) {
    return [...parts, time.text].join("");
  }

  // 每月1号（0 点整省略，对齐「每月1号」）
  if (
    !weekActive &&
    dayActive &&
    monthEvery &&
    isMidnight &&
    (state.day.mode === "specific" || state.day.mode === "list")
  ) {
    return parts.join("");
  }

  // 某月某日 0 点（节日类 cron）→「3月24号」，不加执行
  if (
    !weekActive &&
    dayActive &&
    !monthEvery &&
    isMidnight &&
    state.month.mode === "specific" &&
    state.day.mode === "specific"
  ) {
    return parts.join("");
  }

  if (!weekActive && !dayActive) {
    parts.push(messages.everyDay);
  }

  // 多时刻：每天上午10点，下午2点，4点（不加「执行」）
  // 单时刻：每天凌晨1点执行 / 每天8点执行
  if (time.text) {
    parts.push(time.text);
  }

  const text = parts.join("");
  if (!text) return "";
  if (time.multiClock) return text;
  if (time.withExec === false || /执行$/.test(text)) return text;
  if (time.withExec) return `${text}执行`;
  return text;
}

/**
 * @description 将 Cron 可视化状态转为自然语言摘要
 * @param {CronState} state - 可视化状态
 * @param {DescribeOptions} [options] - locale 等
 * @returns {string} 自然语言描述
 * @example
 * describeCron(createDefaultCronState()); // '每天'
 * describeCron(state, { locale: 'en-US' }); // 'Every day'
 */
export function describeCron(
  state: CronState,
  options?: DescribeOptions
): string {
  const messages = resolveLocale(options?.locale);
  if (messages.code === "zh-CN") {
    return describeCronZh(state, messages) || messages.customSchedule;
  }

  const parts: string[] = [];
  const opt = { locale: messages };

  if (state.year.mode === "specific") {
    parts.push(messages.yearSpecific(String(state.year.value ?? "")));
  } else if (state.year.mode !== "every") {
    const y = describeField("year", state.year, opt);
    if (y) parts.push(y);
  }

  if (state.month.mode !== "every") {
    const m = describeField("month", state.month, opt);
    if (m) parts.push(m);
  }

  if (state.week.mode !== "every" && state.week.mode !== "unset") {
    const w = describeField("week", state.week, opt);
    if (w) parts.push(w);
  } else if (state.day.mode !== "every" && state.day.mode !== "unset") {
    const d = describeField("day", state.day, opt);
    if (d) parts.push(d);
  } else {
    parts.push(messages.everyDay);
  }

  const timeBits: string[] = [];
  if (state.hour.mode === "specific") {
    timeBits.push(messages.hourSpecific(String(state.hour.value ?? "")));
  } else {
    const h = describeField("hour", state.hour, opt);
    if (h) timeBits.push(h);
  }
  if (state.minute.mode === "specific") {
    timeBits.push(messages.minuteSpecific(String(state.minute.value ?? "")));
  } else {
    const m = describeField("minute", state.minute, opt);
    if (m) timeBits.push(m);
  }
  if (state.second.mode === "specific") {
    timeBits.push(messages.secondSpecific(String(state.second.value ?? "")));
  } else {
    const s = describeField("second", state.second, opt);
    if (s) timeBits.push(s);
  }

  if (timeBits.length > 0) {
    parts.push(timeBits.join(" "));
  }

  return parts.join(" ").replace(/\s+/g, " ").trim() || messages.customSchedule;
}
