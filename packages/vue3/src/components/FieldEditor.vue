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

let syncingFromProp = false;

/**
 * @description 从 CronFieldState 同步本地表单
 * @param {CronFieldState} v - 字段状态
 * @returns {void}
 */
function hydrate(v: CronFieldState): void {
  mode.value = v.mode;
  if (v.mode === 'range') {
    rangeStart.value = Number(v.value) || range.value.min;
    rangeEnd.value = Number(v.secondary) || range.value.min + 1;
  } else if (v.mode === 'step') {
    stepBase.value = v.value && v.value !== '*' ? Number(v.value) || range.value.min : range.value.min;
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
    if (v.mode === 'specific') mode.value = 'list';
  }
}

watch(
  () => props.modelValue,
  (v) => {
    syncingFromProp = true;
    hydrate(v);
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
      const a = clamp(rangeStart.value);
      const b = clamp(rangeEnd.value);
      const start = Math.min(a, b);
      const end = Math.max(a, b);
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
      const values = (listVals.value.length ? listVals.value : [gridMin.value]).map(String);
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
 * @description 将数值夹紧到当前字段范围
 * @param {number} n - 原始值
 * @returns {number} 夹紧后的整数
 */
function clamp(n: number): number {
  const v = Math.floor(Number(n));
  if (!Number.isFinite(v)) return range.value.min;
  return Math.min(range.value.max, Math.max(range.value.min, v));
}

/**
 * @description 切换模式
 * @param {UiMode} m - 目标模式
 * @returns {void}
 */
function selectMode(m: UiMode): void {
  if (props.disabled) return;
  mode.value = m;
  if ((m === 'list' || m === 'specific') && listVals.value.length === 0) {
    listVals.value = [gridMin.value];
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
  listVals.value = vals;
  if (mode.value !== 'list') mode.value = 'list';
  emitState();
}
</script>

<template>
  <div class="cz-field" :class="{ 'cz-field--disabled': disabled }">
    <p v-if="disabledReason" class="cz-field__lock">{{ disabledReason }}</p>

    <!-- 每 / 不指定 -->
    <label class="cz-row">
      <input
        type="radio"
        :checked="mode === 'every'"
        :disabled="disabled"
        @change="selectMode('every')"
      />
      <span>
        <strong>每{{ unitLabel }}</strong>
        <em>允许的通配符{{ wildcards }}</em>
      </span>
    </label>

    <label v-if="name === 'day' || name === 'week' || name === 'year'" class="cz-row">
      <input
        type="radio"
        :checked="mode === 'unset'"
        :disabled="disabled"
        @change="selectMode('unset')"
      />
      <span>
        <strong>不指定</strong>
        <em v-if="name === 'year'">非必填</em>
      </span>
    </label>

    <!-- 周期 range -->
    <label class="cz-row">
      <input
        type="radio"
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
            @change="emitState"
          >
            <option v-for="o in weekOptions" :key="o.value" :value="o.value">{{ o.label }}</option>
          </select>
          -
          <select
            v-model.number="rangeEnd"
            :disabled="disabled"
            @focus="focusMode('range')"
            @change="emitState"
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
            @change="emitState"
            @input="emitState"
          />
          -
          <input
            v-model.number="rangeEnd"
            type="number"
            :min="range.min"
            :max="range.max"
            :disabled="disabled"
            @focus="focusMode('range')"
            @change="emitState"
            @input="emitState"
          />
          {{ unitLabel }}
        </template>
      </span>
    </label>

    <!-- 间隔 step（周无此行，对齐 cron.ren） -->
    <label v-if="name !== 'week'" class="cz-row">
      <input
        type="radio"
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
          @change="emitState"
          @input="emitState"
        />
        {{ unitLabel }}开始, 每
        <input
          v-model.number="stepValue"
          type="number"
          min="1"
          :max="range.max"
          :disabled="disabled"
          @focus="focusMode('step')"
          @change="emitState"
          @input="emitState"
        />
        {{ name === 'day' ? '天' : unitLabel }}执行一次
      </span>
    </label>

    <!-- 日：工作日 W -->
    <label v-if="name === 'day'" class="cz-row">
      <input
        type="radio"
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
          @change="emitState"
          @input="emitState"
        />
        号最近的那个工作日
      </span>
    </label>

    <!-- 日：最后一天 L -->
    <label v-if="name === 'day'" class="cz-row">
      <input
        type="radio"
        :checked="mode === 'last'"
        :disabled="disabled"
        @change="selectMode('last')"
      />
      <span><strong>本月最后一天</strong></span>
    </label>

    <!-- 周：第 n 个星期 x -->
    <label v-if="name === 'week'" class="cz-row">
      <input
        type="radio"
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
          @change="emitState"
          @input="emitState"
        />
        个
        <select
          v-model.number="nthWeekday"
          :disabled="disabled"
          @focus="focusMode('nth')"
          @change="emitState"
        >
          <option v-for="o in weekOptions" :key="o.value" :value="o.value">{{ o.label }}</option>
        </select>
      </span>
    </label>

    <!-- 周：本月最后一个星期 x -->
    <label v-if="name === 'week'" class="cz-row">
      <input
        type="radio"
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
          @change="emitState"
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
          :checked="mode === 'list' || mode === 'specific'"
          :disabled="disabled"
          @change="selectMode('list')"
        />
        <strong>指定</strong>
      </label>
      <ValueGrid
        :min="gridMin"
        :max="gridMax"
        :model-value="listVals"
        :disabled="disabled || (mode !== 'list' && mode !== 'specific')"
        :pad="name !== 'week' && name !== 'year'"
        :columns="name === 'month' || name === 'week' ? 7 : name === 'hour' ? 12 : 10"
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
          name="cz-week-format"
          :checked="weekFormat === 'number'"
          :disabled="disabled"
          @change="onWeekFormat('number')"
        />
        数字 1~7（1=周日，2=周一，…，7=周六）
      </label>
      <label class="cz-week-format__opt">
        <input
          type="radio"
          name="cz-week-format"
          :checked="weekFormat === 'abbr'"
          :disabled="disabled"
          @change="onWeekFormat('abbr')"
        />
        英文 SUN、MON、TUE、WED、THU、FRI、SAT
      </label>
    </div>
  </div>
</template>

