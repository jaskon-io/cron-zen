<script setup lang="ts">
/**
 * @description 单字段配置编辑器（交互参考经典 Cron 生成器：单选行 + 行内控件 + 指定格子）
 * @see https://www.cron.ren/index.html
 */
import { computed, watch, ref } from 'vue';
import type {
  CronFieldMode,
  CronFieldName,
  CronFieldState,
  WeekFormat,
} from '@cron-zen/core';
import { FIELD_RANGES, QUARTZ_WEEK_LABELS, QUARTZ_WEEK_UI_ORDER } from '@cron-zen/core';
import ValueGrid from './ValueGrid.vue';

/** 同页多实例时避免 radio name 冲突 */
const modeRadioGroup = `cz-mode-${Math.random().toString(36).slice(2, 9)}`;
const weekFormatGroup = `cz-week-fmt-${Math.random().toString(36).slice(2, 9)}`;

const props = withDefaults(
  defineProps<{
    /** @description 字段名 */
    name: CronFieldName;
    /** @description 字段状态 */
    modelValue: CronFieldState;
    /** @description 是否禁用 */
    disabled?: boolean;
    /** @description 禁用 / 互斥提示 */
    disabledReason?: string;
    /** @description 周字段输出写法（仅 week） */
    weekFormat?: WeekFormat;
  }>(),
  {
    disabled: false,
    weekFormat: 'number' as WeekFormat,
  },
);

const emit = defineEmits<{
  /**
   * @description 字段状态变更
   * @param {CronFieldState} value - 新状态
   */
  (e: 'update:modelValue', value: CronFieldState): void;
  /**
   * @description 周字段写法变更
   * @param {WeekFormat} value - number | abbr
   */
  (e: 'update:weekFormat', value: WeekFormat): void;
}>();

const range = computed(() => FIELD_RANGES[props.name]);
const yearNow = new Date().getFullYear();
const yearMax = yearNow + 23;

const unitLabel = computed(() => {
  const map: Record<CronFieldName, string> = {
    second: '秒',
    minute: '分钟',
    hour: '小时',
    day: '日',
    month: '月',
    week: '周',
    year: '年',
  };
  return map[props.name];
});

const wildcards = computed(() => {
  if (props.name === 'day') return '[, - * / L W]';
  if (props.name === 'week') return '[, - * / L #]';
  return '[, - * /]';
});

/** UI 模式：weekday/last/nth 映射到 CronFieldMode */
type UiMode = CronFieldMode;
const mode = ref<UiMode>(props.modelValue.mode);

const rangeStart = ref(Number(props.modelValue.value ?? range.value.min) || range.value.min);
const rangeEnd = ref(Number(props.modelValue.secondary ?? Math.min(range.value.min + 1, range.value.max)) || range.value.min + 1);
const stepBase = ref(
  props.modelValue.value && props.modelValue.value !== '*'
    ? Number(props.modelValue.value) || range.value.min
    : range.value.min,
);
const stepValue = ref(Number(props.modelValue.secondary ?? 1) || 1);
const weekdayNear = ref(Number(props.modelValue.value ?? 1) || 1);
const nthOrder = ref(Number(props.modelValue.secondary ?? 1) || 1);
const nthWeekday = ref(Number(props.modelValue.value ?? 2) || 2);
const lastWeekday = ref(Number(props.modelValue.value ?? 2) || 2);
const listVals = ref<number[]>(
  (props.modelValue.values ?? [])
    .map((v) => Number(v))
    .filter((n) => Number.isFinite(n)),
);

/** Quartz / cron.ren：1=周日 … 7=周六；UI 文案按周一→周日排列 */
const weekOptions = QUARTZ_WEEK_UI_ORDER.map((value) => ({
  value,
  label: QUARTZ_WEEK_LABELS[value],
}));

const weekLabels: Record<number, string> = { ...QUARTZ_WEEK_LABELS };
const weekOrder = [...QUARTZ_WEEK_UI_ORDER];

const hourGroups = [
  { label: 'AM:', min: 0, max: 11 },
  { label: 'PM:', min: 12, max: 23 },
];

const gridMin = computed(() => {
  if (props.name === 'year') return yearNow;
  if (props.name === 'week') return 1;
  return range.value.min;
});
const gridMax = computed(() => {
  if (props.name === 'year') return yearMax;
  if (props.name === 'week') return 7;
  return range.value.max;
});
/** 指定模式空选时的默认勾选项（周对齐 cron.ren：周一=2） */
const listDefaultValue = computed(() =>
  props.name === 'week' ? QUARTZ_WEEK_UI_ORDER[0] : gridMin.value,
);

let syncingFromProp = false;

/**
 * @description 按字段重置本地控件默认值（避免 Tab 切换串值）
 * @returns {void}
 */
function resetLocalDefaults(): void {
  const min = props.name === 'week' ? 1 : range.value.min;
  const max = props.name === 'week' ? 7 : range.value.max;
  rangeStart.value = props.name === 'week' ? 2 : Math.min(min + (props.name === 'hour' ? 0 : 1), max);
  rangeEnd.value = props.name === 'week' ? 3 : Math.min(rangeStart.value + 1, max);
  if (props.name === 'hour') {
    rangeStart.value = 0;
    rangeEnd.value = 2;
  }
  if (props.name === 'second' || props.name === 'minute') {
    rangeStart.value = 1;
    rangeEnd.value = 2;
  }
  if (props.name === 'day' || props.name === 'month') {
    rangeStart.value = 1;
    rangeEnd.value = 2;
  }
  if (props.name === 'year') {
    rangeStart.value = yearNow;
    rangeEnd.value = yearNow + 1;
  }
  stepBase.value = props.name === 'day' || props.name === 'month' || props.name === 'year' ? Math.max(min, 1) : min;
  if (props.name === 'year') stepBase.value = yearNow;
  stepValue.value = 1;
  weekdayNear.value = 1;
  nthOrder.value = 1;
  nthWeekday.value = 2;
  lastWeekday.value = 2;
  listVals.value = [listDefaultValue.value];
}

/**
 * @description 从 CronFieldState 同步本地表单
 * @param {CronFieldState} v - 字段状态
 * @returns {void}
 */
function hydrate(v: CronFieldState): void {
  mode.value = v.mode === 'specific' ? 'list' : v.mode;
  // 先恢复字段级默认，再按 mode 覆盖，避免跨 Tab 残留
  resetLocalDefaults();

  if (v.mode === 'range') {
    const a = Number(v.value);
    const b = Number(v.secondary);
    // 生成侧会把起止排序成 min-max；若与本地只是顺序不同，保留用户正在编辑的起止，
    // 避免「终点尚小、起点改大」时被回写成对调值（如 9 与 2 → 2-9 冲掉 9）
    const localMin = Math.min(rangeStart.value, rangeEnd.value);
    const localMax = Math.max(rangeStart.value, rangeEnd.value);
    if (
      Number.isFinite(a) &&
      Number.isFinite(b) &&
      a === localMin &&
      b === localMax
    ) {
      // keep rangeStart / rangeEnd
    } else {
      if (Number.isFinite(a)) rangeStart.value = a;
      if (Number.isFinite(b)) rangeEnd.value = b;
    }
  } else if (v.mode === 'step') {
    // */n → 起点按字段最小值回显（对齐 cron.ren「从 0 开始」观感），步长取 secondary
    if (v.value && v.value !== '*') {
      stepBase.value = Number(v.value) || stepBase.value;
    } else {
      stepBase.value =
        props.name === 'day' || props.name === 'month' || props.name === 'year'
          ? Math.max(range.value.min, 1)
          : range.value.min;
    }
    stepValue.value = Number(v.secondary) || 1;
  } else if (v.mode === 'weekday') {
    weekdayNear.value = Number(v.value) || 1;
  } else if (v.mode === 'nth') {
    nthWeekday.value = Number(v.value) || 2;
    nthOrder.value = Number(v.secondary) || 1;
  } else if (v.mode === 'last') {
    if (v.value) lastWeekday.value = Number(v.value) || 2;
  } else if (v.mode === 'list' || v.mode === 'specific') {
    const vals =
      v.mode === 'list'
        ? (v.values ?? []).map(Number).filter((n) => Number.isFinite(n))
        : [Number(v.value)].filter((n) => Number.isFinite(n));
    listVals.value = vals.length ? vals : [gridMin.value];
  }
}

watch(
  () => [props.name, props.modelValue] as const,
  () => {
    syncingFromProp = true;
    hydrate(props.modelValue);
    Promise.resolve().then(() => {
      syncingFromProp = false;
    });
  },
  { deep: true, immediate: true },
);

/**
 * @description 拼装并上抛字段状态
 * @returns {void}
 */
function emitState(): void {
  if (props.disabled || syncingFromProp) return;
  let next: CronFieldState;
  switch (mode.value) {
    case 'every':
      next = { mode: 'every', raw: '*' };
      break;
    case 'unset':
      next = { mode: 'unset', raw: '?' };
      break;
    case 'range': {
      // 对齐 cron.ren：保留用户起止顺序，不强制排序（如周 周六→周二 → 7-3）
      const start = clamp(rangeStart.value);
      const end = clamp(rangeEnd.value);
      next = {
        mode: 'range',
        raw: `${start}-${end}`,
        value: String(start),
        secondary: String(end),
      };
      break;
    }
    case 'step': {
      const base = clamp(stepBase.value);
      const step = Math.max(1, Math.floor(stepValue.value) || 1);
      next = {
        mode: 'step',
        raw: `${base}/${step}`,
        value: String(base),
        secondary: String(step),
      };
      break;
    }
    case 'weekday': {
      const d = Math.min(31, Math.max(1, Math.floor(weekdayNear.value) || 1));
      next = { mode: 'weekday', raw: `${d}W`, value: String(d) };
      break;
    }
    case 'last': {
      if (props.name === 'week') {
        const w = Math.min(7, Math.max(1, Math.floor(lastWeekday.value) || 1));
        next = { mode: 'last', raw: `${w}L`, value: String(w) };
      } else {
        next = { mode: 'last', raw: 'L' };
      }
      break;
    }
    case 'nth': {
      const w = Math.min(7, Math.max(1, Math.floor(nthWeekday.value) || 1));
      const n = Math.min(5, Math.max(1, Math.floor(nthOrder.value) || 1));
      next = {
        mode: 'nth',
        raw: `${w}#${n}`,
        value: String(w),
        secondary: String(n),
      };
      break;
    }
    case 'list':
    case 'specific': {
      const values = (
        listVals.value.length ? listVals.value : [listDefaultValue.value]
      ).map(String);
      next = {
        mode: 'list',
        raw: values.join(','),
        value: values.join(','),
        values,
      };
      break;
    }
    default:
      next = { mode: 'every', raw: '*' };
  }
  emit('update:modelValue', next);
}

/**
 * @description 将数值夹紧到当前字段范围（周字段 UI 使用 1-7，不含 0）
 * @param {number} n - 原始值
 * @returns {number} 夹紧后的整数
 */
function clamp(n: number): number {
  const v = Math.floor(Number(n));
  const min = props.name === 'week' ? 1 : range.value.min;
  const max = props.name === 'week' ? 7 : range.value.max;
  if (!Number.isFinite(v)) return min;
  return Math.min(max, Math.max(min, v));
}

/**
 * @description 切换模式
 * @param {UiMode} m - 目标模式
 * @returns {void}
 */
function selectMode(m: UiMode): void {
  if (props.disabled) return;
  // 用户操作优先，避免 hydrate 微任务未清完时吞掉 emit
  syncingFromProp = false;
  mode.value = m;
  if ((m === 'list' || m === 'specific') && listVals.value.length === 0) {
    listVals.value = [listDefaultValue.value];
  }
  // 周字段缺省区间：周一-周二（Quartz 2-3）
  if (m === 'range' && props.name === 'week') {
    if (rangeStart.value < 1 || rangeStart.value > 7) rangeStart.value = 2;
    if (rangeEnd.value < 1 || rangeEnd.value > 7) rangeEnd.value = 3;
  }
  emitState();
}

/**
 * @description 聚焦行内控件时自动选中对应模式（对齐 cron.ren 联动）
 * @param {UiMode} m - 目标模式
 * @returns {void}
 */
function focusMode(m: UiMode): void {
  if (props.disabled) return;
  if (mode.value !== m) selectMode(m);
}

/**
 * @description 行内控件输入/变更：确保模式已选中并上抛（避免仅改数值未切 radio）
 * @param {UiMode} m - 目标模式
 * @returns {void}
 */
function controlInput(m: UiMode): void {
  if (props.disabled) return;
  syncingFromProp = false;
  if (mode.value !== m) {
    selectMode(m);
    return;
  }
  emitState();
}

/**
 * @description 切换周字段写法
 * @param {WeekFormat} format - number | abbr
 * @returns {void}
 */
function onWeekFormat(format: WeekFormat): void {
  emit('update:weekFormat', format);
}

/**
 * @description 指定格子变更
 * @param {number[]} vals - 选中值
 * @returns {void}
 */
function onList(vals: number[]): void {
  if (props.disabled) return;
  syncingFromProp = false;
  // 限制指定列表长度，避免异常入参撑爆表达式
  const span = Math.max(1, gridMax.value - gridMin.value + 1);
  listVals.value = vals.slice(0, span);
  if (mode.value !== 'list') mode.value = 'list';
  emitState();
}
</script>

<template>
  <div class="cz-field" :class="{ 'cz-field--disabled': disabled }">
    <p v-if="disabledReason" class="cz-field__lock">{{ disabledReason }}</p>

    <!-- 年：不指定在前（对齐 cron.ren） -->
    <label v-if="name === 'year'" class="cz-row">
      <input
        type="radio"
        :name="modeRadioGroup"
        :checked="mode === 'unset'"
        :disabled="disabled"
        @change="selectMode('unset')"
      />
      <span>
        <strong>不指定</strong>
        <em>允许的通配符{{ wildcards }} 非必填</em>
      </span>
    </label>

    <!-- 每 / 每年 -->
    <label class="cz-row">
      <input
        type="radio"
        :name="modeRadioGroup"
        :checked="mode === 'every'"
        :disabled="disabled"
        @change="selectMode('every')"
      />
      <span>
        <strong>每{{ unitLabel }}</strong>
        <em v-if="name !== 'year'">允许的通配符{{ wildcards }}</em>
      </span>
    </label>

    <!-- 日 / 周：不指定 -->
    <label v-if="name === 'day' || name === 'week'" class="cz-row">
      <input
        type="radio"
        :name="modeRadioGroup"
        :checked="mode === 'unset'"
        :disabled="disabled"
        @change="selectMode('unset')"
      />
      <span>
        <strong>不指定</strong>
      </span>
    </label>

    <!-- 周期 range -->
    <label class="cz-row">
      <input
        type="radio"
        :name="modeRadioGroup"
        :checked="mode === 'range'"
        :disabled="disabled"
        @change="selectMode('range')"
      />
      <span class="cz-row__inline">
        <strong>周期</strong>
        从
        <template v-if="name === 'week'">
          <select
            v-model.number="rangeStart"
            :disabled="disabled"
            @focus="focusMode('range')"
            @change="controlInput('range')"
          >
            <option v-for="o in weekOptions" :key="o.value" :value="o.value">{{ o.label }}</option>
          </select>
          -
          <select
            v-model.number="rangeEnd"
            :disabled="disabled"
            @focus="focusMode('range')"
            @change="controlInput('range')"
          >
            <option v-for="o in weekOptions" :key="o.value" :value="o.value">{{ o.label }}</option>
          </select>
        </template>
        <template v-else>
          <input
            v-model.number="rangeStart"
            type="number"
            :min="range.min"
            :max="range.max"
            :disabled="disabled"
            @focus="focusMode('range')"
            @change="controlInput('range')"
            @input="controlInput('range')"
          />
          -
          <input
            v-model.number="rangeEnd"
            type="number"
            :min="range.min"
            :max="range.max"
            :disabled="disabled"
            @focus="focusMode('range')"
            @change="controlInput('range')"
            @input="controlInput('range')"
          />
          {{ unitLabel }}
        </template>
      </span>
    </label>

    <!-- 间隔 step（周无此行，对齐 cron.ren） -->
    <label v-if="name !== 'week'" class="cz-row">
      <input
        type="radio"
        :name="modeRadioGroup"
        :checked="mode === 'step'"
        :disabled="disabled"
        @change="selectMode('step')"
      />
      <span class="cz-row__inline">
        <strong>间隔</strong>
        从
        <input
          v-model.number="stepBase"
          type="number"
          :min="range.min"
          :max="range.max"
          :disabled="disabled"
          @focus="focusMode('step')"
          @change="controlInput('step')"
          @input="controlInput('step')"
        />
        {{ unitLabel }}开始, 每
        <input
          v-model.number="stepValue"
          type="number"
          min="1"
          :max="range.max"
          :disabled="disabled"
          @focus="focusMode('step')"
          @change="controlInput('step')"
          @input="controlInput('step')"
        />
        {{ name === 'day' ? '天' : unitLabel }}执行一次
      </span>
    </label>

    <!-- 日：工作日 W -->
    <label v-if="name === 'day'" class="cz-row">
      <input
        type="radio"
        :name="modeRadioGroup"
        :checked="mode === 'weekday'"
        :disabled="disabled"
        @change="selectMode('weekday')"
      />
      <span class="cz-row__inline">
        每月
        <input
          v-model.number="weekdayNear"
          type="number"
          min="1"
          max="31"
          :disabled="disabled"
          @focus="focusMode('weekday')"
          @change="controlInput('weekday')"
          @input="controlInput('weekday')"
        />
        号最近的那个工作日
      </span>
    </label>

    <!-- 日：最后一天 L -->
    <label v-if="name === 'day'" class="cz-row">
      <input
        type="radio"
        :name="modeRadioGroup"
        :checked="mode === 'last'"
        :disabled="disabled"
        @change="selectMode('last')"
      />
      <span><strong>每月最后一天</strong></span>
    </label>

    <!-- 周：第 n 个星期 x -->
    <label v-if="name === 'week'" class="cz-row">
      <input
        type="radio"
        :name="modeRadioGroup"
        :checked="mode === 'nth'"
        :disabled="disabled"
        @change="selectMode('nth')"
      />
      <span class="cz-row__inline">
        第
        <input
          v-model.number="nthOrder"
          type="number"
          min="1"
          max="5"
          :disabled="disabled"
          @focus="focusMode('nth')"
          @change="controlInput('nth')"
          @input="controlInput('nth')"
        />
        个
        <select
          v-model.number="nthWeekday"
          :disabled="disabled"
          @focus="focusMode('nth')"
          @change="controlInput('nth')"
        >
          <option v-for="o in weekOptions" :key="o.value" :value="o.value">{{ o.label }}</option>
        </select>
      </span>
    </label>

    <!-- 周：本月最后一个星期 x -->
    <label v-if="name === 'week'" class="cz-row">
      <input
        type="radio"
        :name="modeRadioGroup"
        :checked="mode === 'last'"
        :disabled="disabled"
        @change="selectMode('last')"
      />
      <span class="cz-row__inline">
        本月最后一个
        <select
          v-model.number="lastWeekday"
          :disabled="disabled"
          @focus="focusMode('last')"
          @change="controlInput('last')"
        >
          <option v-for="o in weekOptions" :key="o.value" :value="o.value">{{ o.label }}</option>
        </select>
      </span>
    </label>

    <!-- 指定 list -->
    <div class="cz-row cz-row--block">
      <label class="cz-row__head">
        <input
          type="radio"
          :name="modeRadioGroup"
          :checked="mode === 'list' || mode === 'specific'"
          :disabled="disabled"
          @change="selectMode('list')"
        />
        <strong>指定</strong>
      </label>
      <ValueGrid
        :min="gridMin"
        :max="gridMax"
        :model-value="mode === 'list' || mode === 'specific' ? listVals : []"
        :disabled="disabled"
        :pad="name !== 'week' && name !== 'year'"
        :columns="
          name === 'year' ? 6 : name === 'month' ? 12 : name === 'week' ? 7 : name === 'hour' ? 12 : 10
        "
        :labels="name === 'week' ? weekLabels : undefined"
        :order="name === 'week' ? weekOrder : undefined"
        :groups="name === 'hour' ? hourGroups : undefined"
        @update:model-value="onList"
      />
    </div>

    <!-- 周字段写法（对齐 cron.ren） -->
    <div v-if="name === 'week'" class="cz-week-format" role="radiogroup" aria-label="周字段写法">
      <span class="cz-week-format__label">周字段写法：</span>
      <label class="cz-week-format__opt">
        <input
          type="radio"
          :name="weekFormatGroup"
          :checked="weekFormat === 'number'"
          :disabled="disabled"
          @change="onWeekFormat('number')"
        />
        数字 1~7（1=周日，2=周一，…，7=周六）
      </label>
      <label class="cz-week-format__opt">
        <input
          type="radio"
          :name="weekFormatGroup"
          :checked="weekFormat === 'abbr'"
          :disabled="disabled"
          @change="onWeekFormat('abbr')"
        />
        英文 SUN、MON、TUE、WED、THU、FRI、SAT
      </label>
    </div>
  </div>
</template>

